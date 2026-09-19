import express from "express";
import { getAllPriceTypeMaster, getPriceTypeMasterById, savePriceTypeMaster, updatePriceTypeMaster, deletePriceTypeMaster } from "../controllers/priceTypeMaster.controller";

const PriceTypeMasterRouter = express.Router();

PriceTypeMasterRouter.get("/", getAllPriceTypeMaster);
PriceTypeMasterRouter.get("/:id", getPriceTypeMasterById);
PriceTypeMasterRouter.post("/", savePriceTypeMaster);
PriceTypeMasterRouter.put("/:id", updatePriceTypeMaster);
PriceTypeMasterRouter.delete("/:id", deletePriceTypeMaster);

export default PriceTypeMasterRouter;
