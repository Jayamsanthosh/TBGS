import express from "express";
import {
  getAllFuelTypeMaster,
  getFuelTypeOptions,
  getFuelTypeMasterById,
  saveFuelTypeMaster,
  updateFuelTypeMaster,
  deleteFuelTypeMaster
} from "../controllers/fuelTypeMaster.controller";

const FuelTypeMasterRouter = express.Router();

FuelTypeMasterRouter.get("/options", getFuelTypeOptions);
FuelTypeMasterRouter.get("/", getAllFuelTypeMaster);
FuelTypeMasterRouter.get("/:id", getFuelTypeMasterById);
FuelTypeMasterRouter.post("/", saveFuelTypeMaster);
FuelTypeMasterRouter.put("/:id", updateFuelTypeMaster);
FuelTypeMasterRouter.delete("/:id", deleteFuelTypeMaster);

export default FuelTypeMasterRouter;
