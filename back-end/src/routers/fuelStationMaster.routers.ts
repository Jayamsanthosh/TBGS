import express from "express";
import {
  getAllFuelStationMaster,
  getFuelStationMasterById,
  saveFuelStationMaster,
  updateFuelStationMaster,
  deleteFuelStationMaster
} from "../controllers/fuelStationMaster.controller";

const FuelStationMasterRouter = express.Router();

FuelStationMasterRouter.get("/", getAllFuelStationMaster);
FuelStationMasterRouter.get("/:id", getFuelStationMasterById);
FuelStationMasterRouter.post("/", saveFuelStationMaster);
FuelStationMasterRouter.put("/:id", updateFuelStationMaster);
FuelStationMasterRouter.delete("/:id", deleteFuelStationMaster);

export default FuelStationMasterRouter;
