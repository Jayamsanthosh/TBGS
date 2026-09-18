import express from "express";
import {
  getAllShiftNameMaster,
  getShiftNameMasterById,
  saveShiftNameMaster,
  updateShiftNameMaster,
  deleteShiftNameMaster,
} from "../controllers/shiftNameMaster.controller";

const ShiftNameMasterRouter = express.Router();

ShiftNameMasterRouter.get("/", getAllShiftNameMaster);
ShiftNameMasterRouter.get("/:id", getShiftNameMasterById);
ShiftNameMasterRouter.post("/", saveShiftNameMaster);
ShiftNameMasterRouter.put("/:id", updateShiftNameMaster);
ShiftNameMasterRouter.delete("/:id", deleteShiftNameMaster);

export default ShiftNameMasterRouter;
