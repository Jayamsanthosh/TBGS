import express from "express";
import {
  getAllLocationMaster,
  getLocationMasterById,
  saveLocationMaster,
  updateLocationMaster,
  deleteLocationMaster
} from "../controllers/locationMaster.controller";

const LocationMasterRouter = express.Router();

LocationMasterRouter.get("/", getAllLocationMaster);
LocationMasterRouter.get("/:id", getLocationMasterById);
LocationMasterRouter.post("/", saveLocationMaster);
LocationMasterRouter.put("/:id", updateLocationMaster);
LocationMasterRouter.delete("/:id", deleteLocationMaster);

export default LocationMasterRouter;
