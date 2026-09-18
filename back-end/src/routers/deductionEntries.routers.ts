import express from "express";
import {
  getAllDeductionEntries,
  getDeductionEntriesById,
  saveDeductionEntries,
  updateDeductionEntries,
  deleteDeductionEntries,
} from "../controllers/deductionEntries.controller";

const DeductionEntriesRouter = express.Router();

DeductionEntriesRouter.get("/", getAllDeductionEntries);
DeductionEntriesRouter.get("/:id", getDeductionEntriesById);
DeductionEntriesRouter.post("/", saveDeductionEntries);
DeductionEntriesRouter.put("/:id", updateDeductionEntries);
DeductionEntriesRouter.delete("/:id", deleteDeductionEntries);

export default DeductionEntriesRouter;