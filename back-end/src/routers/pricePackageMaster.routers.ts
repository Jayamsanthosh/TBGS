import express from "express";
import { getAllPricePackageMaster, getPricePackageMasterById, savePricePackageMaster, updatePricePackageMaster, deletePricePackageMaster } from "../controllers/pricePackageMaster.controller";

const PricePackageMasterRouter = express.Router();

PricePackageMasterRouter.get("/", getAllPricePackageMaster);
PricePackageMasterRouter.get("/:id", getPricePackageMasterById);
PricePackageMasterRouter.post("/", savePricePackageMaster);
PricePackageMasterRouter.put("/:id", updatePricePackageMaster);
PricePackageMasterRouter.delete("/:id", deletePricePackageMaster);

export default PricePackageMasterRouter;
