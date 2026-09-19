import express from "express";
import { getAllRackSectionMaster, getRackSectionMasterById, saveRackSectionMaster, updateRackSectionMaster, deleteRackSectionMaster } from "../controllers/rackSectionMaster.controller";

const RackSectionMasterRouter = express.Router();

RackSectionMasterRouter.get("/", getAllRackSectionMaster);
RackSectionMasterRouter.get("/:id", getRackSectionMasterById);
RackSectionMasterRouter.post("/", saveRackSectionMaster);
RackSectionMasterRouter.put("/:id", updateRackSectionMaster);
RackSectionMasterRouter.delete("/:id", deleteRackSectionMaster);

export default RackSectionMasterRouter;
