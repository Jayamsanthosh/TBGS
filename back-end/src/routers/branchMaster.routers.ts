import express from "express";
import { getAllBranchMaster, getBranchMasterById, saveBranchMaster, updateBranchMaster, deleteBranchMaster } from "../controllers/branchMaster.controller";

const BranchMasterRouter = express.Router();

BranchMasterRouter.get("/", getAllBranchMaster);
BranchMasterRouter.get("/:id", getBranchMasterById);
BranchMasterRouter.post("/", saveBranchMaster);
BranchMasterRouter.put("/:id", updateBranchMaster);
BranchMasterRouter.delete("/:id", deleteBranchMaster);

export default BranchMasterRouter;