import express from "express";
import {
  getAllDriverMaster,
  getDriverMasterById,
  getDriverOptions,
  saveDriverMaster,
  updateDriverMaster,
  deleteDriverMaster
} from "../controllers/driverMaster.controller";

const DriverMasterRouter = express.Router();

DriverMasterRouter.get("/options", getDriverOptions);
DriverMasterRouter.get("/:id", getDriverMasterById);
DriverMasterRouter.get("/", getAllDriverMaster);
DriverMasterRouter.post("/", saveDriverMaster);
DriverMasterRouter.put("/:id", updateDriverMaster);
DriverMasterRouter.delete("/:id", deleteDriverMaster);

export default DriverMasterRouter;
