import { Request, Response } from "express";
import {
  loginUser,
  changePasswordService,
  getPermissionsByRoleId,
  getUserCompanyInfo,
  getUserEmployeeInfo,
  type UserCompanyInfo,
  type UserEmployeeInfo,
} from "../services/auth.services";
import {
  normalizeRequestedContext,
  resolveLoginContext,
  deriveDefaultContextForLogin,
  type ResolvedLoginContext,
} from "../services/loginContext.services";
import { signAccessToken, signRefreshToken, type JwtSessionContext } from "../utils/jwt";

/* One shape for the company/branch context, shared by login, /auth/permissions
   and /auth/me so the three can never drift apart. branchId/branchName are
   null when the company has no active mapping - that is a valid state, not an
   error, so a missing mapping must never fail a login. */
const toSessionCompany = (c: UserCompanyInfo) => ({
  companyId: c.COMPANY_ID,
  companyName: c.COMPANY_NAME,
  shortCode: c.SHORT_CODE,
  yearCode: c.YEAR_CODE,
  branchId: c.BRANCH_ID ?? null,
  branchName: c.BRANCH_NAME ?? null,
});

/* The employee behind the login, resolved once at login so screens that stamp a
   requester (purchase request) can take it from the session instead of asking the
   user to pick themselves from a list.

   empId is null for a login that is not an employee - either because it has no
   EMP_ID or because the mapped employee row does not exist. That null must be
   respected: REQUESTED_BY_EMP_ID is a real foreign key, so saving the dangling id
   would fail the insert. empName is never empty; it falls back to the login name.

   companyId/branchId/campId/storeId are the header defaults the screen stamps.
   branchId follows companyId: they are resolved as a pair so a document never
   carries one company's id with another company's branch. */
const toSessionEmployee = (e: UserEmployeeInfo) => ({
  empId: e.EMP_ID ?? null,
  empName: e.EMP_NAME,
  companyId: e.COMPANY_ID ?? null,
  branchId: e.BRANCH_ID ?? null,
  campId: e.CAMP_ID ?? null,
  storeId: e.STORE_ID ?? null,
});

const isProd = process.env.NODE_ENV === "production";

/** Shared cookie options for the httpOnly access-token cookie. */
const accessCookieOptions = {
  httpOnly: true,
  secure: isProd, // requires HTTPS in production
  sameSite: "lax" as const,
  path: "/",
  maxAge: 8 * 60 * 60 * 1000, // 8h, keep in sync with JWT_EXPIRES_IN
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
};

/**
 * Turns a validated company pick into the session context.
 *
 * Camp and store are filled from the employee record when the user did not pick
 * them (and did not pick a camp either). That preserves what purchase requests
 * used to stamp while letting an explicit login-screen choice win: the picker
 * is the authority, the employee record is only the fallback for a client that
 * sent no camp/store at all.
 */
const applyEmployeeScopeFallback = (
  context: ResolvedLoginContext,
  employee: { companyId: number | null; branchId: number | null; campId: number | null; storeId: number | null }
): JwtSessionContext => ({
  companyId: context.companyId,
  companyName: context.companyName,
  campId: context.campId ?? employee.campId,
  campName: context.campName,
  storeId: context.storeId ?? employee.storeId,
  storeName: context.storeName,
  branchId: context.branchId,
  branchName: context.branchName,
});

/**
 * The context to embed in the token, for a caller that sent no pick (an API
 * client or the approval app posting bare credentials). Falls back to the
 * login's first mapped company, which is what the session always did, and then
 * to the employee record for camp/store exactly as before.
 */
const deriveContextForToken = async (
  loginId: number,
  employee: { companyId: number | null; branchId: number | null; campId: number | null; storeId: number | null }
): Promise<JwtSessionContext | undefined> => {
  const derived = await deriveDefaultContextForLogin(loginId);
  if (!derived) return undefined;
  return applyEmployeeScopeFallback(derived, employee);
};

export const login = async (req: Request, res: Response) => {
  const { LOGIN_NAME, PASSWORD, COMPANY_ID, CAMP_ID, STORE_ID, BRANCH_ID } = req.body;

  if (!LOGIN_NAME || !PASSWORD) {
    res.status(400).json({ success: false, message: "Username and password are required" });
    return;
  }

  try {
    const user = await loginUser(LOGIN_NAME, PASSWORD);

    if (!user) {
      res.status(401).json({ success: false, message: "Invalid username or password" });
      return;
    }

    /* A pick only counts as "sent" when a company was actually named. Camp,
       store and branch on their own cannot be validated (a store without its
       camp, or a branch without its company, is meaningless), so they are read
       as part of a company-scoped pick and otherwise ignored. */
    const requested = normalizeRequestedContext({ COMPANY_ID, CAMP_ID, STORE_ID, BRANCH_ID });
    const hasPick = requested.companyId !== null;

    /* Re-validated here, not trusted from the dropdown. The dropdowns are built
       from a public endpoint, so the body can be forged by anyone; an unmapped
       combination must fail the login outright rather than be silently swapped
       for the user's first company, which would hide the tampering and leave
       the session scoped to something the user never chose. */
    let context: JwtSessionContext | undefined;
    if (hasPick) {
      const resolved = await resolveLoginContext(user.LOGIN_ID, requested);
      if (!resolved) {
        res.status(400).json({
          success: false,
          message: "The selected company, camp, store or branch is not mapped to this user.",
        });
        return;
      }
      context = resolved;
    }

    const companies = (await getUserCompanyInfo(user.LOGIN_ID, user.LOGIN_NAME)).map(toSessionCompany);

    /* Companies first: the employee record's own company is only a fallback for
       camp/store, and the branch has to be resolved against whichever company
       actually wins. */
    const activeCompany = context
      ? companies.find((c) => c.companyId === context!.companyId)
      : companies[0];
    const employee = toSessionEmployee(
      await getUserEmployeeInfo(user.LOGIN_ID, user.LOGIN_NAME, activeCompany?.companyId ?? null)
    );

    if (!context) {
      context = await deriveContextForToken(user.LOGIN_ID, employee);
    } else {
      context = applyEmployeeScopeFallback(context, employee);
    }

    /* The chosen company is hoisted to the front of the list. Screens that read
       a single company read `context` now, but anything still reading
       companies[0] - an access token minted before this change, the approval
       app - sees the user's actual choice instead of an arbitrary first row. */
    const orderedCompanies = context
      ? [
          ...companies.filter((c) => c.companyId === context!.companyId),
          ...companies.filter((c) => c.companyId !== context!.companyId),
        ]
      : companies;

    /* branchId/branchName stay top-level because screens read a single branch
       from there; they mirror the context so the two can never disagree. */
    const accessToken = signAccessToken({
      sub: user.LOGIN_ID,
      loginName: user.LOGIN_NAME,
      role: user.ROLE,
      roleId: user.ROLE_ID as number,
      companies: orderedCompanies,
      context,
      branchId: context?.branchId ?? null,
      branchName: context?.branchName ?? null,
      employee,
    });

    const refreshToken = signRefreshToken({ sub: user.LOGIN_ID, type: "refresh" });

    // Primary, tamper-proof session store: httpOnly cookies.
    // The browser will send these automatically on every request /
    // page navigation - this is what makes middleware.ts able to
    // gate page access without any JS being able to fake it.
    res.cookie("access_token", accessToken, accessCookieOptions);
    res.cookie("refresh_token", refreshToken, refreshCookieOptions);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.LOGIN_ID,
        loginName: user.LOGIN_NAME,
        role: user.ROLE,
        roleId: user.ROLE_ID,
        mailId: user.MAIL_ID,
        stockShowStatus: user.STOCK_SHOW_STATUS,
        outsideAccessYn: user.OUTSIDE_ACCESS_Y_N,
        monthProcess: user.MONTH_PROCESS,
        yearProcess: user.YEAR_PROCESS,
        companies: orderedCompanies,
        context,
        branchId: context?.branchId ?? activeCompany?.branchId ?? null,
        branchName: context?.branchName ?? activeCompany?.branchName ?? null,
        employee,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(401).json({ success: false, message: error?.message || "Invalid credentials" });
  }
};

/** GET /auth/me - returns the identity encoded in the (already verified) JWT. */
export const me = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }

  res.json({
    success: true,
    data: {
      id: req.user.sub,
      loginName: req.user.loginName,
      role: req.user.role,
      roleId: req.user.roleId,
      companies: req.user.companies,
      /* The company/branch/camp/store chosen at login. Absent on a token minted
         before the login screen had these dropdowns; clients must fall back to
         companies[0] rather than assume it is there. */
      context: req.user.context ?? null,
      branchId: req.user.branchId ?? null,
      branchName: req.user.branchName ?? null,
      employee: req.user.employee ?? null,
    },
  });
};

/**
 * Re-derives the session context for an already-authenticated caller.
 *
 * The JWT's context is signed and therefore trustworthy as a *choice*, but the
 * mapping behind it can be revoked while the token is still alive. Re-checking
 * against the DB keeps the existing promise of this endpoint - that a corrected
 * mapping takes effect without a fresh login - instead of letting a withdrawn
 * store stay in scope until the token expires.
 *
 * Returns undefined when the choice no longer holds, which leaves the caller to
 * fall back to the login's first company exactly as it did before.
 */
const revalidateContext = async (
  loginId: number,
  claimed: JwtSessionContext | undefined
): Promise<JwtSessionContext | undefined> => {
  if (!claimed) return undefined;
  const resolved = await resolveLoginContext(loginId, {
    companyId: claimed.companyId ?? null,
    campId: claimed.campId ?? null,
    storeId: claimed.storeId ?? null,
    branchId: claimed.branchId ?? null,
  });
  return resolved ?? undefined;
};

/** Puts the active company at the front without disturbing the rest. */
const withActiveCompanyFirst = <T extends { companyId: number }>(
  companies: T[],
  activeCompanyId: number | undefined
): T[] => {
  if (activeCompanyId === undefined) return companies;
  return [
    ...companies.filter((c) => c.companyId === activeCompanyId),
    ...companies.filter((c) => c.companyId !== activeCompanyId),
  ];
};

/**
 * GET /auth/permissions
 * Returns every active screen the caller's ROLE is permitted to use.
 * This is the single source of truth the frontend uses to:
 *   - build the sidebar
 *   - decide whether to render a page, or bounce to /unauthorized
 * It is always re-derived from the DB (never trusts the JWT contents
 * beyond roleId), so permission changes take effect on next fetch.
 *
 * The company/branch/camp/store the user picked at login rides along on the same
 * response. It is echoed rather than re-defaulted, so the frontend can refresh
 * permissions without wiping the active context back to the first company.
 */
export const getPermissions = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }

  try {
    const loginId = Number(req.user.sub);
    const permissions = await getPermissionsByRoleId(req.user.roleId);
    const companies = (await getUserCompanyInfo(loginId, req.user.loginName)).map(toSessionCompany);

    /* Re-derived from the DB like the companies, so a corrected employee mapping
       takes effect without forcing a fresh login. */
    const context = await revalidateContext(loginId, req.user.context);
    const activeCompany = context
      ? companies.find((c) => c.companyId === context.companyId)
      : companies[0];

    const employee = toSessionEmployee(
      await getUserEmployeeInfo(loginId, req.user.loginName, activeCompany?.companyId ?? null)
    );

    res.json({
      success: true,
      data: permissions.map((p) => ({
        linkId: p.LINK_ID,
        linkName: p.LINK_NAME,
        pageAction: p.PAGE_ACTION,
        linkLocation: p.LINK_LOCATION,
        redirectionType: p.REDIRECTION_TYPE,
      })),
      companies: withActiveCompanyFirst(companies, activeCompany?.companyId),
      context: context ?? null,
      branchId: context?.branchId ?? activeCompany?.branchId ?? null,
      branchName: context?.branchName ?? activeCompany?.branchName ?? null,
      employee,
    });
  } catch (error) {
    console.error("getPermissions error:", error);
    res.status(500).json({ success: false, message: "Failed to load permissions" });
  }
};

export const logout = async (_req: Request, res: Response) => {
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/" });
  res.json({ success: true, message: "Logged out" });
};

export const changePassword = async (req: Request, res: Response) => {
  const { LOGIN_ID, USER_NAME, OLD_PASSWORD, NEW_PASSWORD, REASON, STATUS_MASTER, USER, MAC_ADDRESS } = req.body;

  if (!LOGIN_ID) {
    res.status(400).json({ success: false, message: "Login ID is required" });
    return;
  }

  if (!OLD_PASSWORD) {
    res.status(400).json({ success: false, message: "Current password is required" });
    return;
  }

  if (!NEW_PASSWORD) {
    res.status(400).json({ success: false, message: "New password is required" });
    return;
  }

  if (OLD_PASSWORD === NEW_PASSWORD) {
    res.status(400).json({ success: false, message: "New password must be different from current password" });
    return;
  }

  try {
    const result = await changePasswordService({
      LOGIN_ID,
      USER_NAME: USER_NAME || "",
      OLD_PASSWORD,
      NEW_PASSWORD,
      REASON: REASON || "Password Change",
      STATUS_MASTER: STATUS_MASTER || "AC",
      USER: USER || USER_NAME || "Admin",
      MAC_ADDRESS: MAC_ADDRESS || "WEB",
    });

    res.json({ success: true, message: result.message || "Password changed successfully" });
  } catch (error: any) {
    console.error("ChangePassword error:", error);
    res.status(400).json({ success: false, message: error?.message || "Failed to change password" });
  }
};
