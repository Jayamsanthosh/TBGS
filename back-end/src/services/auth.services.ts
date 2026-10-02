import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface LoginRow {
  LOGIN_ID: number;
  LOGIN_NAME: string;
  ROLE: string;          // role name, display only
  ROLE_ID: number | null; // numeric id, used for authorization
  MAIL_ID: string;
  STOCK_SHOW_STATUS: string;
  OUTSIDE_ACCESS_Y_N: string;
  MONTH_PROCESS?: string;
  YEAR_PROCESS?: string;
  USER_STATUS: string;    // AC / IA
  ROLE_STATUS: string | null;
}

/**
 * Looks up the user by credentials AND enforces that both the user
 * account and its role are Active. Requires the updated
 * VMaster.LOGIN_USER stored procedure from rbac_migration.sql, which
 * now also returns ROLE_ID (joined from TBL_ROLE_MASTER).
 */
export const loginUser = async (loginName: string, password: string): Promise<LoginRow | null> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const result = await pool
    .request()
    .input("LOGIN_NAME", sql.VarChar(50), loginName)
    .input("PASSWORD", sql.VarChar(255), password)
    .execute("VMaster.LOGIN_USER");

  const row: any = result.recordset[0];
  if (!row) return null;

  // Retrieve USER_STATUS directly from TBL_USER_INFO_HDR since SP doesn't return it
  const userQuery = await pool
    .request()
    .input("LOGIN_ID", sql.Int, row.LOGIN_ID)
    .query(`SELECT STATUS_MASTER FROM VMaster.TBL_USER_INFO_HDR WHERE LOGIN_ID = @LOGIN_ID`);
  
  const userStatus = userQuery.recordset[0]?.STATUS_MASTER;
  const isUserActive = userStatus && ["AC", "ACTIVE"].includes(userStatus.trim().toUpperCase());
  if (userStatus && !isUserActive) {
    throw new Error("Your account is inactive. Please contact the administrator.");
  }

  // Gracefully handle Data mismatches for Role mapping via a trimmed lowercase lookup
  const roleQuery = await pool
    .request()
    .input("ROLE_NAME", sql.VarChar(50), (row.ROLE || "").trim())
    .query(`
      SELECT ROLE_ID, STATUS_MASTER 
      FROM VMaster.TBL_ROLE_MASTER 
      WHERE LOWER(LTRIM(RTRIM(ROLE_NAME))) = LOWER(@ROLE_NAME)
    `);

  const roleRecord = roleQuery.recordset[0];

  if (!roleRecord || !roleRecord.ROLE_ID) {
    throw new Error("This user is not mapped to a valid role. Please contact the administrator.");
  }

  const roleStatus = roleRecord.STATUS_MASTER;
  const isRoleActive = roleStatus && ["AC", "ACTIVE"].includes(roleStatus.trim().toUpperCase());
  if (roleStatus && !isRoleActive) {
    throw new Error("Your role is inactive. Please contact the administrator.");
  }

  return {
    ...row,
    ROLE_ID: roleRecord.ROLE_ID,
    USER_STATUS: userStatus,
    ROLE_STATUS: roleRecord.STATUS_MASTER,
  } as LoginRow;
};

export interface UserCompanyInfo {
  COMPANY_ID: number;
  COMPANY_NAME: string;
  SHORT_CODE: string;
  YEAR_CODE: string;
  /* Branch this company is mapped to, or null when it has no active mapping.
     A login can span several companies, each with its own branch, so this is
     per company rather than a single value for the user. */
  BRANCH_ID: number | null;
  BRANCH_NAME: string | null;
}

/** Employee identity of the logged-in login, as resolved for the session. */
export interface UserEmployeeInfo {
  /* Null when the login has no employee row, or when its EMP_ID points at a row
     that no longer exists. Callers must treat null as "not an employee" rather
     than saving the dangling id - REQUESTED_BY_EMP_ID has an enforced FK. */
  EMP_ID: number | null;
  /* Never empty. Falls back to the login name so an account without an employee
     record still shows who it is instead of a blank or an 'EMP <id>' string. */
  EMP_NAME: string;
  /* Employee defaults that screens stamp onto their header, mirroring what the
     old Requested By dropdown used to apply when an employee was picked. */
  COMPANY_ID: number | null;
  /* Branch mapped to COMPANY_ID above - resolved against the *effective* company,
     never against the login's mapped company, because the two can differ (login
     'test' is mapped to company 6 but its employee belongs to company 7). Pairing
     one company's id with another company's branch would be a value that exists in
     neither. Null when the effective company has no active branch mapping. */
  BRANCH_ID: number | null;
  CAMP_ID: number | null;
  STORE_ID: number | null;
}

/* TBL_USER_INFO_HDR.EMP_ID is the login -> employee link, but it is not
   trustworthy on its own: 'sandy' has none, and 'sri' points at EMP_ID 102 which
   has no row in NEW_EMPLOYEE_DATABASE. Selecting the employee with an INNER
   JOIN would silently drop both, and sending the raw EMP_ID onward would trip
   FK_TBL_PURCHASE_REQUEST_HDR_REQUESTED_BY. So the join is a LEFT JOIN and the
   EMP_ID is only reported when a real employee row backs it up. */
const USER_EMPLOYEE_SELECT = `
  SELECT TOP 1
    U.LOGIN_NAME,
    U.EMP_ID                                        AS MAPPED_EMP_ID,
    E.EMP_ID                                        AS EMP_ID,
    LTRIM(RTRIM(
      ISNULL(E.FIRST_NAME, '') + ' ' +
      ISNULL(E.MIDDLE_NAME, '') + ' ' +
      ISNULL(E.LAST_NAME, '')
    ))                                              AS FULL_NAME,
    E.COMPANY_ID,
    E.CAMP_ID,
    E.STORE_ID
  FROM VMaster.TBL_USER_INFO_HDR U
  LEFT JOIN VPayEntries.NEW_EMPLOYEE_DATABASE E ON E.EMP_ID = U.EMP_ID
  WHERE U.LOGIN_ID = @LOGIN_ID
  ORDER BY U.LOGIN_ID
`;

/* Branch for the effective company, i.e. the employee's company when there is one
   and the login's mapped company otherwise. Same "earliest active mapping" rule as
   BRANCH_APPLY below, so both paths pick the same branch for the same company. */
const BRANCH_FOR_COMPANY_SELECT = `
  SELECT TOP 1 MB.BRANCH_ID AS BRANCH_ID
  FROM VMaster.TBL_COMPANY_BRANCH_MAPPING MB
  INNER JOIN VMaster.TBL_BRANCH_MASTER BM ON BM.BRANCH_ID = MB.BRANCH_ID
  WHERE MB.COMPANY_ID = @COMPANY_ID
    AND UPPER(MB.STATUS_MASTER) IN ('AC', 'ACTIVE')
    AND UPPER(BM.STATUS_MASTER) IN ('AC', 'ACTIVE')
  ORDER BY MB.MAPPING_ID
`;

/**
 * Resolves the employee identity behind a login so screens that stamp a
 * requester (purchase request) can do it from the session instead of asking the
 * user to pick themselves from a list.
 *
 * The name always resolves: an employee row gives the real full name, and
 * anything else falls back to the login name. EMP_ID is only returned when a
 * matching employee row exists, so a dangling mapping can never be saved into a
 * foreign-keyed column.
 *
 * `mappedCompanyId` is the login's active company, passed in so BRANCH_ID can be
 * resolved against whichever company actually wins: the employee's own company
 * takes precedence, because that is the company the screen will stamp. Without
 * this, a login whose employee belongs to a different company than its mapping
 * would get a branch that belongs to the mapping's company instead.
 */
export const getUserEmployeeInfo = async (
  loginId: number,
  loginName?: string,
  mappedCompanyId?: number | null
): Promise<UserEmployeeInfo> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const fallbackName = (loginName || "").trim();

  try {
    const result = await pool
      .request()
      .input("LOGIN_ID", sql.Int, loginId)
      .query(USER_EMPLOYEE_SELECT);

    const row: any = result.recordset?.[0];
    if (!row) {
      return {
        EMP_ID: null,
        EMP_NAME: fallbackName,
        COMPANY_ID: null,
        BRANCH_ID: await resolveBranchForCompany(pool, mappedCompanyId ?? null),
        CAMP_ID: null,
        STORE_ID: null,
      };
    }

    const fullName = String(row.FULL_NAME ?? "").trim();
    const empId = row.EMP_ID != null ? Number(row.EMP_ID) : null;
    const companyId = row.COMPANY_ID != null ? Number(row.COMPANY_ID) : null;

    return {
      /* Only a real employee row may be surfaced as an id. */
      EMP_ID: empId,
      EMP_NAME: fullName || String(row.LOGIN_NAME ?? "").trim() || fallbackName,
      COMPANY_ID: companyId,
      /* Branch of the company that actually ends up on the document: the employee's
         own company when present, else the login's mapped company. */
      BRANCH_ID: await resolveBranchForCompany(pool, companyId ?? mappedCompanyId ?? null),
      CAMP_ID: row.CAMP_ID ?? null,
      STORE_ID: row.STORE_ID ?? null,
    };
  } catch (error) {
    console.error("getUserEmployeeInfo error:", error);
    throw error;
  }
};

/** Active branch mapped to a company, or null when it has none. */
const resolveBranchForCompany = async (pool: any, companyId: number | null): Promise<number | null> => {
  if (companyId == null) return null;

  const result = await pool
    .request()
    .input("COMPANY_ID", sql.Int, companyId)
    .query(BRANCH_FOR_COMPANY_SELECT);

  const branchId = result.recordset?.[0]?.BRANCH_ID;
  return branchId != null ? Number(branchId) : null;
};

/* The unique key on the mapping is (COMPANY_ID, BRANCH_ID), so a company may
   legitimately be mapped to more than one branch. The session carries one
   branch per company, so pick deterministically - the earliest active mapping -
   rather than letting the row order decide. OUTER APPLY (not a join) so a
   company with no mapping at all still comes back, with a null branch, instead
   of silently vanishing from the user's company list. */
const BRANCH_APPLY = `
  OUTER APPLY (
    SELECT TOP 1 MB.BRANCH_ID AS BRANCH_ID, BM.BRANCH_NAME AS BRANCH_NAME
    FROM VMaster.TBL_COMPANY_BRANCH_MAPPING MB
    INNER JOIN VMaster.TBL_BRANCH_MASTER BM ON BM.BRANCH_ID = MB.BRANCH_ID
    WHERE MB.COMPANY_ID = C.COMPANY_ID
      AND UPPER(MB.STATUS_MASTER) IN ('AC', 'ACTIVE')
      AND UPPER(BM.STATUS_MASTER) IN ('AC', 'ACTIVE')
    ORDER BY MB.MAPPING_ID
  ) BR`;

/**
 * Resolves the company(ies) a login is mapped to via
 * TBL_USER_TO_STORE_MAPPING, joined to company master, plus the branch each
 * company is mapped to via TBL_COMPANY_BRANCH_MAPPING.
 * Used to embed the logged-in user's company/branch context into the JWT.
 * If no active mapping is found for the exact LOGIN_ID, falls back to
 * matching the mapping by LOGIN_NAME (via TBL_USER_INFO_HDR) so a
 * mapping saved against a different row id for the same login still
 * resolves.
 */
export const getUserCompanyInfo = async (loginId: number, loginName?: string): Promise<UserCompanyInfo[]> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const result = await pool
    .request()
    .input("LOGIN_ID", sql.Int, loginId)
    .query(`
      SELECT DISTINCT
        C.COMPANY_ID,
        C.COMPANY_NAME,
        C.SHORT_CODE,
        C.YEAR_CODE,
        BR.BRANCH_ID,
        BR.BRANCH_NAME
      FROM VMaster.TBL_USER_TO_STORE_MAPPING M
      INNER JOIN VMaster.TBL_COMPANY_MASTER C ON C.COMPANY_ID = M.COMPANY_ID
      ${BRANCH_APPLY}
      WHERE M.LOGIN_ID = @LOGIN_ID
        AND UPPER(M.STATUS_MASTER) IN ('AC', 'ACTIVE')
        AND UPPER(C.STATUS_MASTER) IN ('AC', 'ACTIVE')
      ORDER BY C.COMPANY_ID
    `);

  if (result.recordset.length > 0 || !loginName) {
    return result.recordset || [];
  }

  // Fallback: the mapping may have been saved against a different row id
  // that shares the same login name.
  const fallback = await pool
    .request()
    .input("LOGIN_NAME", sql.VarChar(50), loginName)
    .query(`
      SELECT DISTINCT
        C.COMPANY_ID,
        C.COMPANY_NAME,
        C.SHORT_CODE,
        C.YEAR_CODE,
        BR.BRANCH_ID,
        BR.BRANCH_NAME
      FROM VMaster.TBL_USER_TO_STORE_MAPPING M
      INNER JOIN VMaster.TBL_USER_INFO_HDR U ON U.LOGIN_ID = M.LOGIN_ID
      INNER JOIN VMaster.TBL_COMPANY_MASTER C ON C.COMPANY_ID = M.COMPANY_ID
      ${BRANCH_APPLY}
      WHERE LOWER(LTRIM(RTRIM(U.LOGIN_NAME))) = LOWER(LTRIM(RTRIM(@LOGIN_NAME)))
        AND UPPER(M.STATUS_MASTER) IN ('AC', 'ACTIVE')
        AND UPPER(U.STATUS_MASTER) IN ('AC', 'ACTIVE')
        AND UPPER(C.STATUS_MASTER) IN ('AC', 'ACTIVE')
      ORDER BY C.COMPANY_ID
    `);

  return fallback.recordset || [];
};

/** Company IDs the given login is mapped to (used to scope screen lists for non-admins). */
export const getAllowedCompanyIds = async (loginId: number): Promise<number[]> => {
  const companies = await getUserCompanyInfo(loginId);
  return companies.map((c) => c.COMPANY_ID).filter((id) => id != null);
};

export interface PermissionRow {
  LINK_ID: number;
  LINK_NAME: string;
  PAGE_ACTION: string;
  LINK_LOCATION: string;
  REDIRECTION_TYPE: string;
}

/** Every active screen/route a given role is allowed to access. */
export const getPermissionsByRoleId = async (roleId: number): Promise<PermissionRow[]> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  // Fallback to manual query because VMaster.GET_ACTIVE_PERMISSIONS_BY_ROLE does not exist.
  const result = await pool
    .request()
    .input("ROLE_ID", sql.Int, roleId)
    .query(`
      SELECT 
          L.LINK_ID,
          L.LINK_NAME,
          L.PAGE_ACTION,
          L.LINK_LOCATION,
          L.REDIRECTION_TYPE
      FROM VMaster.TBL_ROLE_TO_LINK_AND_PAGE R
      INNER JOIN VMaster.TBL_LINKS_AND_PAGES L ON R.LINK_ID_ROLE_TO_LINK = L.LINK_ID
      WHERE R.ROLE_ID_ROLE_TO_LINK = @ROLE_ID
        AND UPPER(R.STATUS_ROLE_TO_LINK) IN ('AC', 'ACTIVE')
        AND UPPER(L.STATUS_MASTER) IN ('AC', 'ACTIVE')
    `);

  return result.recordset || [];
};

export interface ChangePasswordData {
  LOGIN_ID: number;
  USER_NAME: string;
  OLD_PASSWORD: string;
  NEW_PASSWORD: string;
  REASON: string;
  STATUS_MASTER: string;
  USER: string;
  MAC_ADDRESS: string;
}

export const changePasswordService = async (data: ChangePasswordData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("Login_id", sql.Int, data.LOGIN_ID)
      .input("User_Name", sql.VarChar(50), data.USER_NAME)
      .input("Old_Password", sql.VarChar(50), data.OLD_PASSWORD)
      .input("New_Password", sql.VarChar(50), data.NEW_PASSWORD)
      .input("Reason", sql.VarChar(50), data.REASON)
      .input("STATUS_MASTER", sql.VarChar(50), data.STATUS_MASTER)
      .input("User", sql.VarChar(50), data.USER)
      .input("Mac_address", sql.VarChar(50), data.MAC_ADDRESS)
      .execute("VMaster.Change_Password");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to change password");

    return { message: message || "Password changed successfully" };
  } catch (error) {
    console.error("Change_Password SP error:", error);
    throw error;
  }
};
