import express from "express";
import { getAllCurrencyMaster, getCurrencyMasterById, saveCurrencyMaster, updateCurrencyMaster, deleteCurrencyMaster } from "../controllers/currencyMaster.controller";

const CurrencyMasterRouter = express.Router();

CurrencyMasterRouter.get("/", getAllCurrencyMaster);
CurrencyMasterRouter.get("/:id", getCurrencyMasterById);
CurrencyMasterRouter.post("/", saveCurrencyMaster);
CurrencyMasterRouter.put("/:id", updateCurrencyMaster);
CurrencyMasterRouter.delete("/:id", deleteCurrencyMaster);

export default CurrencyMasterRouter;
