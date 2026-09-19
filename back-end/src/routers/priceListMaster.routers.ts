import express from "express";
import { getAllPriceListMaster, getPriceListMasterById, savePriceListMaster, updatePriceListMaster, deletePriceListMaster } from "../controllers/priceListMaster.controller";

const PriceListMasterRouter = express.Router();

PriceListMasterRouter.get("/", getAllPriceListMaster);
PriceListMasterRouter.get("/:id", getPriceListMasterById);
PriceListMasterRouter.post("/", savePriceListMaster);
PriceListMasterRouter.put("/:id", updatePriceListMaster);
PriceListMasterRouter.delete("/:id", deletePriceListMaster);

export default PriceListMasterRouter;
