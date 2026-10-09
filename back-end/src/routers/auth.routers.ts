import express from "express";
import { login, changePassword, me, getPermissions, logout } from "../controllers/auth.controller";
import { getLoginContext } from "../controllers/loginContext.controller";
import { loginContextRateLimit } from "../middlewares/loginContextRateLimit.middleware";
import { authenticate } from "../middlewares/authenticate.middleware";

const AuthRouter = express.Router();

// Public
AuthRouter.post("/login", login);

/* Public, and rate limited: the login screen needs the company/camp/store list
   before a session exists. The handler returns an identical empty list for an
   unknown username, so this cannot be used to enumerate accounts. */
AuthRouter.get("/login-context", loginContextRateLimit(), getLoginContext);

// Protected - identity/session endpoints only need `authenticate`,
// not `checkPermission`, since every logged-in user is allowed to
// know who they are and what they can see.
AuthRouter.post("/logout", authenticate, logout);
AuthRouter.get("/me", authenticate, me);
AuthRouter.get("/permissions", authenticate, getPermissions);
AuthRouter.post("/change-password", authenticate, changePassword);

export default AuthRouter;
