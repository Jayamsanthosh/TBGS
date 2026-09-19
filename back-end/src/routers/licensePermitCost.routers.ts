import express from "express";
import { getAllLicensePermitCost, getLicensePermitCostById, saveLicensePermitCost, updateLicensePermitCost, deleteLicensePermitCost } from "../controllers/licensePermitCost.controller";

const LicensePermitCostRouter = express.Router();

LicensePermitCostRouter.get("/", getAllLicensePermitCost);
LicensePermitCostRouter.get("/:id", getLicensePermitCostById);
LicensePermitCostRouter.post("/", saveLicensePermitCost);
LicensePermitCostRouter.put("/:id", updateLicensePermitCost);
LicensePermitCostRouter.delete("/:id", deleteLicensePermitCost);

export default LicensePermitCostRouter;
