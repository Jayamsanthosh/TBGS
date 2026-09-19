import express from "express";
import { getAllSalesPackageType, getSalesPackageTypeById, saveSalesPackageType, updateSalesPackageType, deleteSalesPackageType } from "../controllers/salesPackageType.controller";

const SalesPackageTypeRouter = express.Router();

SalesPackageTypeRouter.get("/", getAllSalesPackageType);
SalesPackageTypeRouter.get("/:id", getSalesPackageTypeById);
SalesPackageTypeRouter.post("/", saveSalesPackageType);
SalesPackageTypeRouter.put("/:id", updateSalesPackageType);
SalesPackageTypeRouter.delete("/:id", deleteSalesPackageType);

export default SalesPackageTypeRouter;
