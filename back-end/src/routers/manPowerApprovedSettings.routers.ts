import express from "express";
import {
  getAllManPowerApprovedSettings,
  getManPowerApprovedSettingsById,
  saveManPowerApprovedSettings,
  updateManPowerApprovedSettings,
  deleteManPowerApprovedSettings,
} from "../controllers/manPowerApprovedSettings.controller";

const ManPowerApprovedSettingsRouter = express.Router();

ManPowerApprovedSettingsRouter.get("/", getAllManPowerApprovedSettings);
ManPowerApprovedSettingsRouter.get("/:id", getManPowerApprovedSettingsById);
ManPowerApprovedSettingsRouter.post("/", saveManPowerApprovedSettings);
ManPowerApprovedSettingsRouter.put("/:id", updateManPowerApprovedSettings);
ManPowerApprovedSettingsRouter.delete("/:id", deleteManPowerApprovedSettings);

export default ManPowerApprovedSettingsRouter;
