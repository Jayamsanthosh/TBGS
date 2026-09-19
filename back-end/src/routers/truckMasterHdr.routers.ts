import express from "express";
import {
  getAllTruckMasterHdr,
  getTruckMasterHdrById,
  saveTruckMasterHdr,
  updateTruckMasterHdr,
  deleteTruckMasterHdr
} from "../controllers/truckMasterHdr.controller";

const TruckMasterHdrRouter = express.Router();

TruckMasterHdrRouter.get("/", getAllTruckMasterHdr);
TruckMasterHdrRouter.get("/:id", getTruckMasterHdrById);
TruckMasterHdrRouter.post("/", saveTruckMasterHdr);
TruckMasterHdrRouter.put("/:id", updateTruckMasterHdr);
TruckMasterHdrRouter.delete("/:id", deleteTruckMasterHdr);

export default TruckMasterHdrRouter;
