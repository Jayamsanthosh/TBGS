import { Request, Response } from "express";
import { getLoginContextTreeByLoginName, type LoginContextTree } from "../services/loginContext.services";

/* The one shape this endpoint ever returns data in. An unknown login name, an
   inactive account and a known account with no mappings all resolve to
   `companies: []`, so a caller cannot tell them apart and therefore cannot use
   the endpoint to discover which usernames are real. */
const EMPTY_TREE: LoginContextTree = { companies: [] };

/**
 * GET /auth/login-context?loginName=...
 *
 * Feeds the company / branch / camp / store dropdowns on the login screen.
 *
 * PUBLIC by necessity - the dropdowns have to fill in before there is a
 * session - which is why this handler is deliberately dull: it never reveals
 * whether the login exists, never reveals a role or a status, and never varies
 * its shape. Rate limiting lives on the route; see loginContextRateLimit.
 *
 * A 500 is still a real 500. Hiding a database outage behind an empty list
 * would leave the user staring at permanently empty dropdowns with no clue why,
 * and that failure mode is not useful to an attacker either.
 */
export const getLoginContext = async (req: Request, res: Response) => {
  const loginName = String(req.query.loginName ?? req.query.LOGIN_NAME ?? "").trim();

  if (!loginName) {
    res.status(400).json({
      success: false,
      message: "loginName is required",
      data: EMPTY_TREE,
    });
    return;
  }

  try {
    const tree = await getLoginContextTreeByLoginName(loginName);
    res.json({ success: true, data: tree });
  } catch (error: any) {
    console.error("getLoginContext error:", error);
    res.status(500).json({ success: false, message: "Failed to load login options" });
  }
};
