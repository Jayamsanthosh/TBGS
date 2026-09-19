import express from "express";
import {
  getAllOverTimeReferenceEntries,
  getOverTimeReferenceEntriesById,
  saveOverTimeReferenceEntries,
  updateOverTimeReferenceEntries,
  submitOverTimeReferenceEntries,
  deleteOverTimeReferenceEntries,
} from "../controllers/overtimeReferenceEntries.controller";

const OverTimeReferenceEntriesRouter = express.Router();

OverTimeReferenceEntriesRouter.get("/", getAllOverTimeReferenceEntries);
OverTimeReferenceEntriesRouter.get("/:id", getOverTimeReferenceEntriesById);
OverTimeReferenceEntriesRouter.post("/", saveOverTimeReferenceEntries);
OverTimeReferenceEntriesRouter.post("/:id/submit", submitOverTimeReferenceEntries);
OverTimeReferenceEntriesRouter.put("/:id", updateOverTimeReferenceEntries);
OverTimeReferenceEntriesRouter.delete("/:id", deleteOverTimeReferenceEntries);

export default OverTimeReferenceEntriesRouter;