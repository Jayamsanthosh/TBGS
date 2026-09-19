import express from "express";
import { getAllSalesTypeMaster, getSalesTypeMasterById, saveSalesTypeMaster, updateSalesTypeMaster, deleteSalesTypeMaster } from "../controllers/salesTypeMaster.controller";

const SalesTypeMasterRouter = express.Router();

SalesTypeMasterRouter.get("/", getAllSalesTypeMaster);
SalesTypeMasterRouter.get("/:id", getSalesTypeMasterById);
SalesTypeMasterRouter.post("/", saveSalesTypeMaster);
SalesTypeMasterRouter.put("/:id", updateSalesTypeMaster);
SalesTypeMasterRouter.delete("/:id", deleteSalesTypeMaster);

export default SalesTypeMasterRouter;
