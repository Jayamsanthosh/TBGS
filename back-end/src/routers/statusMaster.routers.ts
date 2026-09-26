import express from "express";
import {
  getAllStatusMaster,
  getStatusMasterById,
  getStatusMasterLoad,
  saveStatusMaster,
  updateStatusMaster,
  deleteStatusMaster
} from "../controllers/statusMaster.controller";

const StatusMasterRouter = express.Router();

StatusMasterRouter.get("/", getAllStatusMaster);
StatusMasterRouter.get("/load", getStatusMasterLoad);
StatusMasterRouter.get("/:id", getStatusMasterById);
StatusMasterRouter.post("/", saveStatusMaster);
StatusMasterRouter.put("/:id", updateStatusMaster);
StatusMasterRouter.delete("/:id", deleteStatusMaster);

export default StatusMasterRouter;