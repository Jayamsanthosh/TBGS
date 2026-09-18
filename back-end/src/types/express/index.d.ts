import { JwtPayload } from "../../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      /** Populated by the `authenticate` middleware after verifying the JWT. */
      user?: JwtPayload;
    }
  }
}

export {};
