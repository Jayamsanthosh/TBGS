import express from "express";
import {
  getAllTruckTypeMaster,
  getTruckTypeMasterById,
  saveTruckTypeMaster,
  updateTruckTypeMaster,
  deleteTruckTypeMaster
} from "../controllers/truckTypeMaster.controller";

const TruckTypeMasterRouter = express.Router();

TruckTypeMasterRouter.get("/", getAllTruckTypeMaster);
TruckTypeMasterRouter.get("/:id", getTruckTypeMasterById);
TruckTypeMasterRouter.post("/", saveTruckTypeMaster);
TruckTypeMasterRouter.put("/:id", updateTruckTypeMaster);
TruckTypeMasterRouter.delete("/:id", deleteTruckTypeMaster);

export default TruckTypeMasterRouter;
