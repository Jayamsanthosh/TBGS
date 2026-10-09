import jwt, { SignOptions } from "jsonwebtoken";

/**
 * JWT_SECRET must be set via env var in production. The fallback value
 * here only exists so local dev doesn't crash - it is NOT safe to ship.
 */
export const JWT_SECRET: string =
  process.env.JWT_SECRET || "agromanage-dev-secret-key-change-in-production";

export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";
export const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

/** Shape of the data we embed inside the access token. */
export interface JwtCompanyInfo {
  companyId: number;
  companyName: string;
  shortCode: string;
  yearCode: string;
  /** Branch this company is mapped to; null when it has no active mapping. */
  branchId: number | null;
  branchName: string | null;
}

/**
 * The company/branch/camp/store the user actually picked on the login screen,
 * validated against TBL_USER_TO_STORE_MAPPING before it was written here.
 *
 * This is the scope every screen should read. `companies` below is the full
 * list of what the user MAY switch to; `context` is the one they DID choose.
 * Any id is null when the login is not mapped to it - a company with no active
 * branch mapping legitimately has a null branch, which is a valid state and
 * never an error.
 */
export interface JwtSessionContext {
  companyId: number;
  companyName: string;
  campId: number | null;
  campName: string | null;
  storeId: number | null;
  storeName: string | null;
  branchId: number | null;
  branchName: string | null;
}

export interface JwtEmployeeInfo {
  /**
   * Employee id for the login, or null when the login is not an employee - it has
   * no EMP_ID, or the mapped employee row does not exist. Callers must not write a
   * null-backed id anywhere foreign keyed; the id is only ever set when a real
   * employee row backs it.
   */
  empId: number | null;
  /** Employee full name, falling back to the login name. Never empty. */
  empName: string;
  /** Employee's own company/camp/store defaults, used to stamp new documents. */
  companyId: number | null;
  /** Branch mapped to companyId above, not to the login's mapped company. */
  branchId: number | null;
  campId: number | null;
  storeId: number | null;
}

export interface JwtPayload {
  sub: number;          // LOGIN_ID
  loginName: string;
  role: string;          // ROLE_NAME (display only, never trust for authz)
  roleId: number;        // ROLE_ID - the ONLY value used for authorization
  /** Company context resolved from the user's store mapping. */
  companies?: JwtCompanyInfo[];
  /**
   * The active company/branch/camp/store, chosen at login and re-validated
   * against the user's mapping. Optional because an access token minted before
   * the login screen had these dropdowns has no such claim - consumers must
   * fall back to `companies[0]` rather than assume it is present.
   */
  context?: JwtSessionContext;
  /** Branch of the active (first) company, hoisted for screens that read one. */
  branchId?: number | null;
  branchName?: string | null;
  /** Employee identity of the login, so screens can stamp themselves. */
  employee?: JwtEmployeeInfo;
}

export interface RefreshPayload {
  sub: number;
  type: "refresh";
}

export const signAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as SignOptions);
};

export const signRefreshToken = (payload: RefreshPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN } as SignOptions);
};

export const verifyToken = <T = JwtPayload>(token: string): T => {
  // Throws if invalid / expired / tampered with - callers must catch.
  return jwt.verify(token, JWT_SECRET) as T;
};
