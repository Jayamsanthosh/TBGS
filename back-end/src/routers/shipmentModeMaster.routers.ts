import express from "express";
import {
  getAllShipmentModeMaster,
  getShipmentModeMasterById,
  getShipmentModeMasterLoad,
  saveShipmentModeMaster,
  updateShipmentModeMaster,
  deleteShipmentModeMaster
} from "../controllers/shipmentModeMaster.controller";

const ShipmentModeMasterRouter = express.Router();

ShipmentModeMasterRouter.get("/", getAllShipmentModeMaster);
ShipmentModeMasterRouter.get("/load", getShipmentModeMasterLoad);
ShipmentModeMasterRouter.get("/:id", getShipmentModeMasterById);
ShipmentModeMasterRouter.post("/", saveShipmentModeMaster);
ShipmentModeMasterRouter.put("/:id", updateShipmentModeMaster);
ShipmentModeMasterRouter.delete("/:id", deleteShipmentModeMaster);

export default ShipmentModeMasterRouter;