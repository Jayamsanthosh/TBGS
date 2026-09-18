import express from "express"
import { getAllRoles, getRole, saveRole, updateRole, deleteRole } from "../controllers/role.controller";

const RoleRouter = express.Router()

RoleRouter.get("/", getAllRoles);
RoleRouter.get("/:id", getRole);
RoleRouter.post("/", saveRole);
RoleRouter.put("/:id", updateRole);
RoleRouter.delete("/:id", deleteRole);

export default RoleRouter;
