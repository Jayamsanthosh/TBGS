import { Request, Response, NextFunction, RequestHandler } from "express";
import sql from "mssql";
import { getPool } from "../config/db";

/**
 * In-process cache of (roleId + moduleKey) -> allowed, so a burst of
 * requests to the same screen doesn't hit SQL Server every time.
 * Kept intentionally short-lived so permission changes made in the
 * Role-To-Link master take effect quickly without a server restart.
 */
const CACHE_TTL_MS = 30_000;
const permissionCache = new Map<string, { allowed: boolean; expiresAt: number }>();

const cacheGet = (key: string): boolean | undefined => {
  const hit = permissionCache.get(key);
  if (!hit) return undefined;
  if (hit.expiresAt < Date.now()) {
    permissionCache.delete(key);
    return undefined;
  }
  return hit.allowed;
};

const cacheSet = (key: string, allowed: boolean) => {
  permissionCache.set(key, { allowed, expiresAt: Date.now() + CACHE_TTL_MS });
};

/** Clears the whole cache - call this after editing Role-To-Link mappings. */
export const clearPermissionCache = () => permissionCache.clear();

const checkRoutePermissionInDb = async (roleId: number, linkLocation: string): Promise<boolean> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  // Fallback to manual query if VMaster.CHECK_ROUTE_PERMISSION does not exist
  const result = await pool
    .request()
    .input("ROLE_ID", sql.Int, roleId)
    .input("LINK_LOCATION", sql.VarChar(200), linkLocation)
    .query(`
      SELECT TOP 1 1 AS ALLOWED
      FROM VMaster.TBL_ROLE_TO_LINK_AND_PAGE R
      INNER JOIN VMaster.TBL_LINKS_AND_PAGES L ON R.LINK_ID_ROLE_TO_LINK = L.LINK_ID
      WHERE R.ROLE_ID_ROLE_TO_LINK = @ROLE_ID
        AND LOWER(LTRIM(RTRIM(L.LINK_LOCATION))) = LOWER(LTRIM(RTRIM(@LINK_LOCATION)))
        AND UPPER(R.STATUS_ROLE_TO_LINK) IN ('AC', 'ACTIVE')
        AND UPPER(L.STATUS_MASTER) IN ('AC', 'ACTIVE')
    `);

  return Boolean(result.recordset?.[0]?.ALLOWED);
};

/**
 * checkPermission(moduleKey)
 * ---------------------------------------------------------------------
 * Step 2 of RBAC: given WHO the caller is (req.user, set by
 * `authenticate`), decide whether their ROLE is allowed to hit THIS
 * route, by checking TBL_ROLE_TO_LINK_AND_PAGE / TBL_LINKS_AND_PAGES.
 *
 * `moduleKey` should be the same value stored in
 * TBL_LINKS_AND_PAGES.LINK_LOCATION for this screen, e.g. "/company-master".
 * If omitted, it is derived from `req.baseUrl` (the Express mount
 * path), which in this codebase already matches LINK_LOCATION 1:1
 * (see src/routers/index.ts - every router is mounted at the same
 * kebab-case path used by the corresponding Next.js page).
 *
 * An array may be passed instead of a single key: access is granted if
 * the role is allowed ANY of the given module keys. This is used for
 * shared sub-resources (e.g. the DMS files tab) that are embedded inside
 * several parent screens and should be transparently accessible to roles
 * that can open those parents.
 *
 * ALWAYS returns 403 Forbidden (never a redirect, never a silent
 * pass-through) when permission is denied - the frontend decides how
 * to present that to the user.
 * ---------------------------------------------------------------------
 */
export const checkPermission = (moduleKeys?: string | string[]): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        // Defensive - should never happen if `authenticate` ran first.
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }

      let keys: string[] = Array.isArray(moduleKeys)
        ? moduleKeys.slice()
        : moduleKeys
        ? [moduleKeys]
        : [];

      if (keys.length === 0) {
        const derived = (req.baseUrl || req.path || "").trim();
        if (derived) keys.push(derived);
      }

      // Normalise to unique, trimmed, lower-cased keys.
      const unique = [...new Set(keys.map((k) => (k || "").trim().toLowerCase()).filter(Boolean))];

      if (unique.length === 0) {
        res.status(403).json({ success: false, message: "Access denied: unknown resource" });
        return;
      }

      let allowed = false;
      for (const key of unique) {
        const cacheKey = `${req.user.roleId}:${key}`;
        let a = cacheGet(cacheKey);
        if (a === undefined) {
          a = await checkRoutePermissionInDb(req.user.roleId, key);
          cacheSet(cacheKey, a);
        }
        if (a) {
          allowed = true;
          break;
        }
      }

      if (!allowed) {
        res.status(403).json({
          success: false,
          message: "Access denied: you do not have permission to perform this action",
        });
        return;
      }

      next();
    } catch (error) {
      console.error("checkPermission error:", error);
      res.status(500).json({ success: false, message: "Permission check failed" });
    }
  };
};
