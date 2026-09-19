import express from "express";
import { getAllCostCentreMaster, getCostCentreMasterById, saveCostCentreMaster, updateCostCentreMaster, deleteCostCentreMaster } from "../controllers/costCentreMaster.controller";

const CostCentreMasterRouter = express.Router();

CostCentreMasterRouter.get("/", getAllCostCentreMaster);
CostCentreMasterRouter.get("/:id", getCostCentreMasterById);
CostCentreMasterRouter.post("/", saveCostCentreMaster);
CostCentreMasterRouter.put("/:id", updateCostCentreMaster);
CostCentreMasterRouter.delete("/:id", deleteCostCentreMaster);

export default CostCentreMasterRouter;
