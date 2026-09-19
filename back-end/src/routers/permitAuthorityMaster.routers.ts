import express from "express";
import { getAllPermitAuthorityMaster, getPermitAuthorityMasterById, savePermitAuthorityMaster, updatePermitAuthorityMaster, deletePermitAuthorityMaster } from "../controllers/permitAuthorityMaster.controller";

const PermitAuthorityMasterRouter = express.Router();

PermitAuthorityMasterRouter.get("/", getAllPermitAuthorityMaster);
PermitAuthorityMasterRouter.get("/:id", getPermitAuthorityMasterById);
PermitAuthorityMasterRouter.post("/", savePermitAuthorityMaster);
PermitAuthorityMasterRouter.put("/:id", updatePermitAuthorityMaster);
PermitAuthorityMasterRouter.delete("/:id", deletePermitAuthorityMaster);

export default PermitAuthorityMasterRouter;