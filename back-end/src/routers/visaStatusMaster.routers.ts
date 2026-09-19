import express from "express";
import { getAllVisaStatusMaster, getVisaStatusMasterById, saveVisaStatusMaster, updateVisaStatusMaster, deleteVisaStatusMaster } from "../controllers/visaStatusMaster.controller";

const VisaStatusMasterRouter = express.Router();

VisaStatusMasterRouter.get("/", getAllVisaStatusMaster);
VisaStatusMasterRouter.get("/:id", getVisaStatusMasterById);
VisaStatusMasterRouter.post("/", saveVisaStatusMaster);
VisaStatusMasterRouter.put("/:id", updateVisaStatusMaster);
VisaStatusMasterRouter.delete("/:id", deleteVisaStatusMaster);

export default VisaStatusMasterRouter;