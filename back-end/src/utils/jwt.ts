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
}

export interface JwtPayload {
  sub: number;          // LOGIN_ID
  loginName: string;
  role: string;          // ROLE_NAME (display only, never trust for authz)
  roleId: number;        // ROLE_ID - the ONLY value used for authorization
  /** Company context resolved from the user's store mapping. */
  companies?: JwtCompanyInfo[];
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
