import express from "express";
import {
  getAllBloodGroupMaster,
  getBloodGroupMasterById,
  saveBloodGroupMaster,
  updateBloodGroupMaster,
  deleteBloodGroupMaster
} from "../controllers/bloodGroupMaster.controller";

const BloodGroupMasterRouter = express.Router();

BloodGroupMasterRouter.get("/", getAllBloodGroupMaster);
BloodGroupMasterRouter.get("/:id", getBloodGroupMasterById);
BloodGroupMasterRouter.post("/", saveBloodGroupMaster);
BloodGroupMasterRouter.put("/:id", updateBloodGroupMaster);
BloodGroupMasterRouter.delete("/:id", deleteBloodGroupMaster);

export default BloodGroupMasterRouter;
