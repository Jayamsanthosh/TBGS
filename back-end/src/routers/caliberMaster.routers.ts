import express from "express";
import { getAllCaliberMaster, getCaliberMasterById, saveCaliberMaster, updateCaliberMaster, deleteCaliberMaster } from "../controllers/caliberMaster.controller";

const CaliberMasterRouter = express.Router();

CaliberMasterRouter.get("/", getAllCaliberMaster);
CaliberMasterRouter.get("/:id", getCaliberMasterById);
CaliberMasterRouter.post("/", saveCaliberMaster);
CaliberMasterRouter.put("/:id", updateCaliberMaster);
CaliberMasterRouter.delete("/:id", deleteCaliberMaster);

export default CaliberMasterRouter;
