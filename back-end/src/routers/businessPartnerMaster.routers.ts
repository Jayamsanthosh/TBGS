import express from "express";
import { getAllBusinessPartnerMaster, getBusinessPartnerMasterById, saveBusinessPartnerMaster, updateBusinessPartnerMaster, deleteBusinessPartnerMaster } from "../controllers/businessPartnerMaster.controller";

const BusinessPartnerMasterRouter = express.Router();

BusinessPartnerMasterRouter.get("/", getAllBusinessPartnerMaster);
BusinessPartnerMasterRouter.get("/:id", getBusinessPartnerMasterById);
BusinessPartnerMasterRouter.post("/", saveBusinessPartnerMaster);
BusinessPartnerMasterRouter.put("/:id", updateBusinessPartnerMaster);
BusinessPartnerMasterRouter.delete("/:id", deleteBusinessPartnerMaster);

export default BusinessPartnerMasterRouter;
