import express from "express";
import { getAllPriceType, getPriceTypeById, savePriceType, updatePriceType, deletePriceType } from "../controllers/priceType.controller";

const PriceTypeRouter = express.Router();

PriceTypeRouter.get("/", getAllPriceType);
PriceTypeRouter.get("/:id", getPriceTypeById);
PriceTypeRouter.post("/", savePriceType);
PriceTypeRouter.put("/:id", updatePriceType);
PriceTypeRouter.delete("/:id", deletePriceType);

export default PriceTypeRouter;
