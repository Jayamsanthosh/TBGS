import express from "express";
import {
  getAllManPowerChangeRequest,
  getManPowerChangeRequestById,
  saveManPowerChangeRequest,
  updateManPowerChangeRequest,
  deleteManPowerChangeRequest,
} from "../controllers/manPowerChangeRequest.controller";

const ManPowerChangeRequestRouter = express.Router();

ManPowerChangeRequestRouter.get("/", getAllManPowerChangeRequest);
ManPowerChangeRequestRouter.get("/:id", getManPowerChangeRequestById);
ManPowerChangeRequestRouter.post("/", saveManPowerChangeRequest);
ManPowerChangeRequestRouter.put("/:id", updateManPowerChangeRequest);
ManPowerChangeRequestRouter.delete("/:id", deleteManPowerChangeRequest);

export default ManPowerChangeRequestRouter;
