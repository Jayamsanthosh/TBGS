import express from "express";
import { getAllRoleToLink, getRoleToLinkById, saveRoleToLink, syncRoleToLink, updateRoleToLink, deleteRoleToLink } from "../controllers/roleToLink.controller";

const RoleToLinkRouter = express.Router();

RoleToLinkRouter.get("/", getAllRoleToLink);
RoleToLinkRouter.get("/:id", getRoleToLinkById);
RoleToLinkRouter.post("/", saveRoleToLink);
RoleToLinkRouter.post("/sync", syncRoleToLink);
RoleToLinkRouter.put("/:id", updateRoleToLink);
RoleToLinkRouter.delete("/:id", deleteRoleToLink);

export default RoleToLinkRouter;
