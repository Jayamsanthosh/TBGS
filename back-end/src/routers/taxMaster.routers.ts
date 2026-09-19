import express from "express";
import {
  getAllTaxMaster,
  getTaxMasterById,
  saveTaxMaster,
  updateTaxMaster,
  deleteTaxMaster
} from "../controllers/taxMaster.controller";

const TaxMasterRouter = express.Router();

TaxMasterRouter.get("/", getAllTaxMaster);
TaxMasterRouter.get("/:id", getTaxMasterById);
TaxMasterRouter.post("/", saveTaxMaster);
TaxMasterRouter.put("/:id", updateTaxMaster);
TaxMasterRouter.delete("/:id", deleteTaxMaster);

export default TaxMasterRouter;