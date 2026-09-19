import express from "express";
import { getAllPriorityMaster, getPriorityMasterById, savePriorityMaster, updatePriorityMaster, deletePriorityMaster } from "../controllers/priorityMaster.controller";

const PriorityMasterRouter = express.Router();

PriorityMasterRouter.get("/", getAllPriorityMaster);
PriorityMasterRouter.get("/:id", getPriorityMasterById);
PriorityMasterRouter.post("/", savePriorityMaster);
PriorityMasterRouter.put("/:id", updatePriorityMaster);
PriorityMasterRouter.delete("/:id", deletePriorityMaster);

export default PriorityMasterRouter;