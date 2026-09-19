import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt";

/**
 * authenticate
 * ---------------------------------------------------------------------
 * Step 1 of RBAC: prove WHO the caller is.
 *
 * Accepts the token from either:
 *   - httpOnly cookie `access_token` (set by POST /auth/login) - primary,
 *     tamper-proof source used by the browser automatically.
 *   - `Authorization: Bearer <token>` header - kept for API clients /
 *     Postman / mobile, and for backward compatibility with the
 *     existing frontend code that also keeps the token in memory.
 *
 * On success it attaches the decoded payload to `req.user` and calls
 * next(). On any failure it responds 401 immediately - it NEVER lets
 * the request continue, because every downstream handler is allowed
 * to assume `req.user` exists.
 * ---------------------------------------------------------------------
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const cookieToken = (req as any).cookies?.access_token as string | undefined;

    const authHeader = req.headers.authorization;
    const headerToken =
      authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

    const token = cookieToken || headerToken;

    if (!token) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const decoded = verifyToken<JwtPayload>(token);

    if (!decoded || (!decoded.roleId && decoded.roleId !== 0)) {
      res.status(401).json({ success: false, message: "Invalid session, please log in again" });
      return;
    }

    // Ensure roleId is always a number for downstream consumers
    decoded.roleId = Number(decoded.roleId);

    if (isNaN(decoded.roleId)) {
      res.status(401).json({ success: false, message: "Corrupted session token" });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    // Covers expired tokens, bad signature, malformed tokens, etc.
    res.status(401).json({ success: false, message: "Session expired or invalid, please log in again" });
  }
};
