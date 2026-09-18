import express from "express";
import {
  getAllLaborChargeEntries,
  getLaborChargeEntriesById,
  saveLaborChargeEntries,
  updateLaborChargeEntries,
  deleteLaborChargeEntries,
} from "../controllers/laborChargeEntries.controller";

const LaborChargeEntriesRouter = express.Router();

LaborChargeEntriesRouter.get("/", getAllLaborChargeEntries);
LaborChargeEntriesRouter.get("/:id", getLaborChargeEntriesById);
LaborChargeEntriesRouter.post("/", saveLaborChargeEntries);
LaborChargeEntriesRouter.put("/:id", updateLaborChargeEntries);
LaborChargeEntriesRouter.delete("/:id", deleteLaborChargeEntries);

export default LaborChargeEntriesRouter;