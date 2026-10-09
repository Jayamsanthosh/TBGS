import sql from "mssql";
import { getPool } from "../config/db";

/**
 * loginContext
 * ---------------------------------------------------------------------
 * Resolves which company / branch / camp / store a login is allowed to pick
 * on the login screen, and re-checks that pick when the login is actually
 * attempted.
 *
 * The source of truth is VMaster.TBL_USER_TO_STORE_MAPPING
 * (LOGIN_ID, COMPANY_ID, CAMP_ID, STORE_ID, ROLE_ID, STATUS_MASTER) - the
 * "User to Store Mapping" screen writes exactly these columns, so whatever an
 * admin grants there is what the login screen may offer.
 *
 * Branch is NOT on that table. It is reachable only through
 * VMaster.TBL_COMPANY_BRANCH_MAPPING (COMPANY_ID, BRANCH_ID), so a branch is
 * a function of the COMPANY alone - the login screen must therefore load it
 * when the company is chosen, not after the camp or store.
 *
 * VMaster.TBL_CAMP_MASTER has no COMPANY_ID column, so camp-to-company is only
 * ever expressed through the mapping tables. That is why the mapping rows are
 * the authority here rather than an intersection with
 * TBL_COMPANY_CAMP_STORE_MAPPING: intersecting would silently hide a camp that
 * a user is legitimately mapped to but that the company-camp-store table does
 * not list, leaving them unable to log in at all.
 */

export interface LoginContextBranch {
  branchId: number;
  branchName: string;
}

export interface LoginContextStore {
  storeId: number;
  storeName: string;
}

export interface LoginContextCamp {
  campId: number;
  campName: string;
  stores: LoginContextStore[];
}

export interface LoginContextCompany {
  companyId: number;
  companyName: string;
  /** Branches this company is mapped to. Empty when it has no active mapping. */
  branches: LoginContextBranch[];
  camps: LoginContextCamp[];
}

export interface LoginContextTree {
  companies: LoginContextCompany[];
}

/** One row of the flat query below, before it is folded into the tree. */
interface ContextRow {
  COMPANY_ID: number | null;
  COMPANY_NAME: string | null;
  CAMP_ID: number | null;
  CAMP_NAME: string | null;
  STORE_ID: number | null;
  STORE_NAME: string | null;
  BRANCH_ID: number | null;
  BRANCH_NAME: string | null;
}

/* Branches of a company, resolved as a set so one query covers every company
   the login is mapped to. Only active mappings joined to active branch rows
   count, mirroring the BRANCH_APPLY rule already used for the session in
   auth.services.ts so the login screen and the session agree on what a
   company's branch is. */
const BRANCH_JOIN = `
  OUTER APPLY (
    SELECT MB.BRANCH_ID, BM.BRANCH_NAME
    FROM VMaster.TBL_COMPANY_BRANCH_MAPPING MB
    INNER JOIN VMaster.TBL_BRANCH_MASTER BM ON BM.BRANCH_ID = MB.BRANCH_ID
    WHERE MB.COMPANY_ID = M.COMPANY_ID
      AND UPPER(MB.STATUS_MASTER) IN ('AC', 'ACTIVE')
      AND UPPER(BM.STATUS_MASTER) IN ('AC', 'ACTIVE')
  ) BR
`;

/* CAMP and STORE are LEFT JOINed, never INNER: a mapping row saved with only a
   COMPANY_ID is still a company the user may log into, and hiding it would
   turn a half-filled mapping into a login the user cannot complete. */
const MAPPING_ROWS_SELECT = `
  SELECT
    M.COMPANY_ID,
    C.COMPANY_NAME,
    CP.CAMP_ID,
    CP.CAMP_NAME,
    S.STORE_ID,
    S.STORE_NAME,
    BR.BRANCH_ID,
    BR.BRANCH_NAME
  FROM VMaster.TBL_USER_TO_STORE_MAPPING M
  INNER JOIN VMaster.TBL_COMPANY_MASTER C ON C.COMPANY_ID = M.COMPANY_ID
  LEFT JOIN VMaster.TBL_CAMP_MASTER CP
    ON CP.CAMP_ID = M.CAMP_ID AND UPPER(CP.STATUS_MASTER) IN ('AC', 'ACTIVE')
  LEFT JOIN VMaster.TBL_STORE_MASTER S
    ON S.STORE_ID = M.STORE_ID AND UPPER(S.STATUS_MASTER) IN ('AC', 'ACTIVE')
  ${BRANCH_JOIN}
  WHERE M.LOGIN_ID = @LOGIN_ID
    AND UPPER(M.STATUS_MASTER) IN ('AC', 'ACTIVE')
    AND UPPER(C.STATUS_MASTER) IN ('AC', 'ACTIVE')
  ORDER BY C.COMPANY_ID, CP.CAMP_ID, S.STORE_ID, BR.BRANCH_ID
`;

/**
 * The login name is matched trimmed and case-insensitively rather than exactly:
 * loginUser() in auth.services.ts trims the input before calling
 * VMaster.LOGIN_USER, so " admin " and "admin" are the same account there and
 * must be the same account here too - otherwise the dropdowns would come back
 * empty for a name the login itself accepts.
 *
 * Returns null when no active user row matches. Callers must treat null exactly
 * like "a user with no mappings" and never distinguish the two in a response.
 */
export const resolveLoginIdByName = async (loginName: string): Promise<number | null> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const result = await pool
    .request()
    .input("LOGIN_NAME", sql.VarChar(50), (loginName || "").trim())
    .query(`
      SELECT TOP 1 U.LOGIN_ID
      FROM VMaster.TBL_USER_INFO_HDR U
      WHERE LOWER(LTRIM(RTRIM(U.LOGIN_NAME))) = LOWER(LTRIM(RTRIM(@LOGIN_NAME)))
        AND UPPER(U.STATUS_MASTER) IN ('AC', 'ACTIVE')
      ORDER BY U.LOGIN_ID
    `);

  const loginId = result.recordset?.[0]?.LOGIN_ID;
  return loginId != null ? Number(loginId) : null;
};

const toId = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * Folds the flat mapping rows into the nested company -> {branches, camps ->
 * stores} shape the login screen renders.
 *
 * Ordering is preserved from the query so the first option of every dropdown
 * is deterministic. A camp that has no store mapping still appears, with an
 * empty store list, because the login screen needs to be able to say "this
 * camp has no stores" rather than hide the camp and look like the user has no
 * access at all.
 */
const foldRows = (rows: ContextRow[]): LoginContextTree => {
  const companies = new Map<number, LoginContextCompany>();
  const campsByCompany = new Map<number, Map<number, LoginContextCamp>>();
  const branchesByCompany = new Map<number, Set<number>>();
  const branchNames = new Map<number, string>();

  for (const row of rows) {
    const companyId = toId(row.COMPANY_ID);
    if (companyId === null) continue;

    let company = companies.get(companyId);
    if (!company) {
      company = {
        companyId,
        companyName: String(row.COMPANY_NAME ?? "").trim() || `Company ${companyId}`,
        branches: [],
        camps: [],
      };
      companies.set(companyId, company);
      campsByCompany.set(companyId, new Map());
      branchesByCompany.set(companyId, new Set());
    }

    /* Branches come from the OUTER APPLY, so the same branch repeats on every
       row of a company. Dedupe by id, keeping the first name seen. */
    const branchId = toId(row.BRANCH_ID);
    if (branchId !== null) {
      const seen = branchesByCompany.get(companyId)!;
      if (!seen.has(branchId)) {
        seen.add(branchId);
        branchNames.set(branchId, String(row.BRANCH_NAME ?? "").trim() || `Branch ${branchId}`);
      }
    }

    const campId = toId(row.CAMP_ID);
    if (campId === null) continue;

    const campMap = campsByCompany.get(companyId)!;
    let camp = campMap.get(campId);
    if (!camp) {
      camp = {
        campId,
        campName: String(row.CAMP_NAME ?? "").trim() || `Camp ${campId}`,
        stores: [],
      };
      campMap.set(campId, camp);
      company.camps.push(camp);
    }

    const storeId = toId(row.STORE_ID);
    if (storeId === null) continue;
    if (camp.stores.some((s) => s.storeId === storeId)) continue;
    camp.stores.push({
      storeId,
      storeName: String(row.STORE_NAME ?? "").trim() || `Store ${storeId}`,
    });
  }

  for (const [companyId, company] of companies) {
    const seen = branchesByCompany.get(companyId)!;
    company.branches = Array.from(seen).map((branchId) => ({
      branchId,
      branchName: branchNames.get(branchId) ?? `Branch ${branchId}`,
    }));
  }

  return { companies: Array.from(companies.values()) };
};

/** The mapping rows for a login id. Shared by the tree and the validator. */
const fetchMappingRows = async (loginId: number): Promise<ContextRow[]> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const result = await pool
    .request()
    .input("LOGIN_ID", sql.Int, loginId)
    .query(MAPPING_ROWS_SELECT);

  return (result.recordset || []) as ContextRow[];
};

/**
 * The full set of company/branch/camp/store combinations a login name may pick
 * from. Returns an empty tree for an unknown login name - deliberately the same
 * result as a known login with no mappings, so the response cannot be used to
 * tell whether a username exists.
 */
export const getLoginContextTreeByLoginName = async (loginName: string): Promise<LoginContextTree> => {
  const loginId = await resolveLoginIdByName(loginName);
  if (loginId === null) return { companies: [] };

  const rows = await fetchMappingRows(loginId);
  return foldRows(rows);
};

/** The same tree, for a login id already known (i.e. after a successful login). */
export const getLoginContextTreeByLoginId = async (loginId: number): Promise<LoginContextTree> => {
  const rows = await fetchMappingRows(loginId);
  return foldRows(rows);
};

/** A pick made on the login screen. Any id may be null except COMPANY_ID. */
export interface RequestedLoginContext {
  companyId: number | null;
  campId: number | null;
  storeId: number | null;
  branchId: number | null;
}

export interface ResolvedLoginContext {
  companyId: number;
  companyName: string;
  campId: number | null;
  campName: string | null;
  storeId: number | null;
  storeName: string | null;
  branchId: number | null;
  branchName: string | null;
}

/** Normalizes loosely-typed ids from a request body into positive numbers. */
export const normalizeRequestedContext = (raw: any): RequestedLoginContext => ({
  companyId: toId(raw?.COMPANY_ID ?? raw?.companyId),
  campId: toId(raw?.CAMP_ID ?? raw?.campId),
  storeId: toId(raw?.STORE_ID ?? raw?.storeId),
  branchId: toId(raw?.BRANCH_ID ?? raw?.branchId),
});

/**
 * The membership test against an already-fetched tree, so validating and then
 * labelling a pick costs one query instead of two.
 */
const isContextAllowedInTree = (tree: LoginContextTree, requested: RequestedLoginContext): boolean => {
  if (requested.companyId === null) return false;

  const company = tree.companies.find((c) => c.companyId === requested.companyId);
  if (!company) return false;

  if (requested.campId !== null) {
    const camp = company.camps.find((c) => c.campId === requested.campId);
    if (!camp) return false;

    if (requested.storeId !== null) {
      const store = camp.stores.find((s) => s.storeId === requested.storeId);
      if (!store) return false;
    } else if (camp.stores.length > 0) {
      /* The user has stores under this camp but did not pick one. Refusing here
         keeps the session from carrying a camp with an ambiguous store. */
      return false;
    }
  } else if (requested.storeId !== null) {
    /* A store without its camp would break the store -> camp pairing that
       documents rely on, so a store may never stand alone. */
    return false;
  }

  if (requested.branchId !== null) {
    if (!company.branches.some((b) => b.branchId === requested.branchId)) return false;
  }

  return true;
};

/**
 * Re-checks a pick against the mapping table.
 *
 * The login screen's dropdowns are only a convenience - they are built from a
 * public endpoint that anyone can call - so this is the check that actually
 * decides what a session may be scoped to. A forged body naming a real company
 * the user is not mapped to has to fail here, not be quietly corrected.
 *
 * CAMP_ID and STORE_ID are optional because a mapping row may carry only a
 * company. BRANCH_ID is optional because a company with no active branch
 * mapping is a valid state (the session has always treated it as null rather
 * than an error); when one IS supplied it must belong to the chosen company.
 */
export const isContextAllowedForUser = async (
  loginId: number,
  requested: RequestedLoginContext
): Promise<boolean> => {
  const tree = await getLoginContextTreeByLoginId(loginId);
  return isContextAllowedInTree(tree, requested);
};

/**
 * Resolves a validated pick into the labelled shape that goes into the session.
 * Returns null when the pick is not allowed, so callers cannot accidentally
 * stamp an unvalidated context.
 */
export const resolveLoginContext = async (
  loginId: number,
  requested: RequestedLoginContext
): Promise<ResolvedLoginContext | null> => {
  const tree = await getLoginContextTreeByLoginId(loginId);
  if (!isContextAllowedInTree(tree, requested)) return null;

  const company = tree.companies.find((c) => c.companyId === requested.companyId)!;
  const camp = requested.campId !== null
    ? company.camps.find((c) => c.campId === requested.campId) ?? null
    : null;
  const store = camp && requested.storeId !== null
    ? camp.stores.find((s) => s.storeId === requested.storeId) ?? null
    : null;
  const branch = requested.branchId !== null
    ? company.branches.find((b) => b.branchId === requested.branchId) ?? null
    : null;

  return {
    companyId: company.companyId,
    companyName: company.companyName,
    campId: camp?.campId ?? null,
    campName: camp?.campName ?? null,
    storeId: store?.storeId ?? null,
    storeName: store?.storeName ?? null,
    branchId: branch?.branchId ?? null,
    branchName: branch?.branchName ?? null,
  };
};

/**
 * The context to use when the client sent no pick at all (an API client, or the
 * approval app, that posts only credentials). Deliberately reproduces what the
 * session used before the login screen had dropdowns: the first company the
 * login is mapped to, plus the branch that company maps to.
 *
 * Camp and store are left null on purpose. Picking one here would be a guess -
 * a login mapped to three camps has no obvious default, and a wrong guess would
 * stamp a document header with a camp the user never chose. Those two stay the
 * employee record's business, exactly as before, until a client actually picks.
 */
export const deriveDefaultContextForLogin = async (
  loginId: number
): Promise<ResolvedLoginContext | null> => {
  const tree = await getLoginContextTreeByLoginId(loginId);
  const company = tree.companies[0];
  if (!company) return null;

  const branch = company.branches[0] ?? null;

  return {
    companyId: company.companyId,
    companyName: company.companyName,
    campId: null,
    campName: null,
    storeId: null,
    storeName: null,
    branchId: branch?.branchId ?? null,
    branchName: branch?.branchName ?? null,
  };
};
