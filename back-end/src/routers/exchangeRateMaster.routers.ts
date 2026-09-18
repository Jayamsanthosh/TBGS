import express from "express";
import {
  getAllExchangeRateMaster,
  getExchangeRateMasterById,
  saveExchangeRateMaster,
  updateExchangeRateMaster,
  deleteExchangeRateMaster
} from "../controllers/exchangeRateMaster.controller";

const ExchangeRateMasterRouter = express.Router();

ExchangeRateMasterRouter.get("/", getAllExchangeRateMaster);
ExchangeRateMasterRouter.get("/:id", getExchangeRateMasterById);
ExchangeRateMasterRouter.post("/", saveExchangeRateMaster);
ExchangeRateMasterRouter.put("/:id", updateExchangeRateMaster);
ExchangeRateMasterRouter.delete("/:id", deleteExchangeRateMaster);

export default ExchangeRateMasterRouter;
