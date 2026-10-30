import express from "express";
import {
  getAllTransportServiceTypeMaster,
  getTransportServiceTypeMasterById,
  saveTransportServiceTypeMaster,
  updateTransportServiceTypeMaster,
  deleteTransportServiceTypeMaster,
} from "../controllers/transportServiceTypeMaster.controller";

const TransportServiceTypeMasterRouter = express.Router();

TransportServiceTypeMasterRouter.get("/", getAllTransportServiceTypeMaster);
TransportServiceTypeMasterRouter.get("/:id", getTransportServiceTypeMasterById);
TransportServiceTypeMasterRouter.post("/", saveTransportServiceTypeMaster);
TransportServiceTypeMasterRouter.put("/:id", updateTransportServiceTypeMaster);
TransportServiceTypeMasterRouter.delete("/:id", deleteTransportServiceTypeMaster);

export default TransportServiceTypeMasterRouter;
