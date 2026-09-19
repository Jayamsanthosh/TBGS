import express from "express";
import {
  getAllDeductionEntries,
  getDeductionEntriesById,
  saveDeductionEntries,
  updateDeductionEntries,
  submitDeductionEntries,
  deleteDeductionEntries,
} from "../controllers/deductionEntries.controller";

const DeductionEntriesRouter = express.Router();

DeductionEntriesRouter.get("/", getAllDeductionEntries);
DeductionEntriesRouter.get("/:id", getDeductionEntriesById);
DeductionEntriesRouter.post("/", saveDeductionEntries);
DeductionEntriesRouter.post("/:id/submit", submitDeductionEntries);
DeductionEntriesRouter.put("/:id", updateDeductionEntries);
DeductionEntriesRouter.delete("/:id", deleteDeductionEntries);

export default DeductionEntriesRouter;