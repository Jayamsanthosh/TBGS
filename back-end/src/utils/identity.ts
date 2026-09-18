import { Request } from "express";

export interface IdentityInfo {
  USER: string;
  ROLE: string;
  MAC_ADDRESS: string;
}

export const identityFrom = (req: Request): IdentityInfo => {
  const user = (req as any).user as { loginName?: string; role?: string } | undefined;
  return {
    USER: user?.loginName || "",
    ROLE: user?.role || "",
    MAC_ADDRESS: "WEB"
  };
};