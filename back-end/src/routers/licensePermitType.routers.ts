import express from "express";
import { getAllLicensePermitType, getLicensePermitTypeById, saveLicensePermitType, updateLicensePermitType, deleteLicensePermitType } from "../controllers/licensePermitType.controller";

const LicensePermitTypeRouter = express.Router();

LicensePermitTypeRouter.get("/", getAllLicensePermitType);
LicensePermitTypeRouter.get("/:id", getLicensePermitTypeById);
LicensePermitTypeRouter.post("/", saveLicensePermitType);
LicensePermitTypeRouter.put("/:id", updateLicensePermitType);
LicensePermitTypeRouter.delete("/:id", deleteLicensePermitType);

export default LicensePermitTypeRouter;
