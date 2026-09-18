import { Request, Response } from "express";
import {
  loginUser,
  changePasswordService,
  getPermissionsByRoleId,
  getUserCompanyInfo,
} from "../services/auth.services";
import { signAccessToken, signRefreshToken } from "../utils/jwt";

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

export const login = async (req: Request, res: Response) => {
  const { LOGIN_NAME, PASSWORD } = req.body;

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

    const companies = (await getUserCompanyInfo(user.LOGIN_ID)).map((c) => ({
      companyId: c.COMPANY_ID,
      companyName: c.COMPANY_NAME,
      shortCode: c.SHORT_CODE,
      yearCode: c.YEAR_CODE,
    }));

    const accessToken = signAccessToken({
      sub: user.LOGIN_ID,
      loginName: user.LOGIN_NAME,
      role: user.ROLE,
      roleId: user.ROLE_ID as number,
      companies,
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
        companies,
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
    },
  });
};

/**
 * GET /auth/permissions
 * Returns every active screen the caller's ROLE is permitted to use.
 * This is the single source of truth the frontend uses to:
 *   - build the sidebar
 *   - decide whether to render a page, or bounce to /unauthorized
 * It is always re-derived from the DB (never trusts the JWT contents
 * beyond roleId), so permission changes take effect on next fetch.
 */
export const getPermissions = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }

  try {
    const permissions = await getPermissionsByRoleId(req.user.roleId);
    res.json({
      success: true,
      data: permissions.map((p) => ({
        linkId: p.LINK_ID,
        linkName: p.LINK_NAME,
        pageAction: p.PAGE_ACTION,
        linkLocation: p.LINK_LOCATION,
        redirectionType: p.REDIRECTION_TYPE,
      })),
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
