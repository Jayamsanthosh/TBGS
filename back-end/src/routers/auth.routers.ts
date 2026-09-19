import express from "express";
import { login, changePassword, me, getPermissions, logout } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/authenticate.middleware";

const AuthRouter = express.Router();

// Public
AuthRouter.post("/login", login);

// Protected - identity/session endpoints only need `authenticate`,
// not `checkPermission`, since every logged-in user is allowed to
// know who they are and what they can see.
AuthRouter.post("/logout", authenticate, logout);
AuthRouter.get("/me", authenticate, me);
AuthRouter.get("/permissions", authenticate, getPermissions);
AuthRouter.post("/change-password", authenticate, changePassword);

export default AuthRouter;
