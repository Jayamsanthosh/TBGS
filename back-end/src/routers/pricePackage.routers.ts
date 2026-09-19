import express from "express";
import { getAllPricePackage, getPricePackageById, savePricePackage, updatePricePackage, deletePricePackage } from "../controllers/pricePackage.controller";

const PricePackageRouter = express.Router();

PricePackageRouter.get("/", getAllPricePackage);
PricePackageRouter.get("/:id", getPricePackageById);
PricePackageRouter.post("/", savePricePackage);
PricePackageRouter.put("/:id", updatePricePackage);
PricePackageRouter.delete("/:id", deletePricePackage);

export default PricePackageRouter;
