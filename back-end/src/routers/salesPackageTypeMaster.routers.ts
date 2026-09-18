import express from "express";
import { getAllSalesPackageTypeMaster, getSalesPackageTypeMasterById, saveSalesPackageTypeMaster, updateSalesPackageTypeMaster, deleteSalesPackageTypeMaster } from "../controllers/salesPackageTypeMaster.controller";

const SalesPackageTypeMasterRouter = express.Router();

SalesPackageTypeMasterRouter.get("/", getAllSalesPackageTypeMaster);
SalesPackageTypeMasterRouter.get("/:id", getSalesPackageTypeMasterById);
SalesPackageTypeMasterRouter.post("/", saveSalesPackageTypeMaster);
SalesPackageTypeMasterRouter.put("/:id", updateSalesPackageTypeMaster);
SalesPackageTypeMasterRouter.delete("/:id", deleteSalesPackageTypeMaster);

export default SalesPackageTypeMasterRouter;
