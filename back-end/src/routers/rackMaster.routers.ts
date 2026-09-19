import express from "express";
import { getAllRackMaster, getRackMasterById, saveRackMaster, updateRackMaster, deleteRackMaster } from "../controllers/rackMaster.controller";

const RackMasterRouter = express.Router();

RackMasterRouter.get("/", getAllRackMaster);
RackMasterRouter.get("/:id", getRackMasterById);
RackMasterRouter.post("/", saveRackMaster);
RackMasterRouter.put("/:id", updateRackMaster);
RackMasterRouter.delete("/:id", deleteRackMaster);

export default RackMasterRouter;
