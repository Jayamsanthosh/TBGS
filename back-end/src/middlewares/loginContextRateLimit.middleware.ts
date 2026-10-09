import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Rate limiter for the PUBLIC login-context lookup.
 *
 * GET /auth/login-context answers "which company is this username mapped to"
 * without a password, so it is the one endpoint in the app that can be driven
 * by an anonymous caller in bulk. Two things bound that:
 *
 *   - the response never varies for an unknown user, so the endpoint cannot be
 *     used to enumerate usernames (see loginContext.controller.ts), and
 *   - this limiter caps how fast one client can ask.
 *
 * Deliberately in-process, like the permission cache in
 * checkPermission.middleware.ts - the app has no shared store to hang a real
 * limiter off, and adding a dependency for one route is not worth it. The
 * consequence to be aware of: with more than one node behind the load balancer
 * the effective limit is per node. That is acceptable for a deterrent, and it
 * is why the budget is generous enough not to trip a real person typing a
 * username.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

/** Pruning interval, so a long-lived process does not accumulate dead keys. */
const SWEEP_MS = 5 * 60_000;

interface Bucket {
  count: number;
  /** When this bucket's window ends. */
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Last sweep time, module-level so it is shared by every handler instance. */
let lastSweepAt = 0;

const clientKey = (req: Request): string => {
  /* req.ip already honours `trust proxy`, which server.ts has to set for the
     app to see the real client address behind IIS/nginx. Falling back to
     socket address keeps the key defined if that is ever misconfigured. */
  return req.ip || req.socket?.remoteAddress || "unknown";
};

const sweep = (now: number) => {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
};

export const loginContextRateLimit = (): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();

    if (now - lastSweepAt > SWEEP_MS) {
      lastSweepAt = now;
      sweep(now);
    }

    const key = clientKey(req);
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
      next();
      return;
    }

    bucket.count += 1;

    if (bucket.count > MAX_REQUESTS) {
      const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSec));
      /* Same empty shape as a successful lookup, so a throttled caller learns
         nothing about whether the username it was asking about exists. */
      res.status(429).json({
        success: false,
        message: "Too many requests. Please try again shortly.",
        data: { companies: [] },
      });
      return;
    }

    next();
  };
};

/** Test seam - lets a script reset the limiter between cases. */
export const resetLoginContextRateLimit = () => buckets.clear();
