import express from "express";
import {
  getAllOverTimeReferenceEntries,
  getOverTimeReferenceEntriesById,
  saveOverTimeReferenceEntries,
  updateOverTimeReferenceEntries,
  deleteOverTimeReferenceEntries,
} from "../controllers/overtimeReferenceEntries.controller";

const OverTimeReferenceEntriesRouter = express.Router();

OverTimeReferenceEntriesRouter.get("/", getAllOverTimeReferenceEntries);
OverTimeReferenceEntriesRouter.get("/:id", getOverTimeReferenceEntriesById);
OverTimeReferenceEntriesRouter.post("/", saveOverTimeReferenceEntries);
OverTimeReferenceEntriesRouter.put("/:id", updateOverTimeReferenceEntries);
OverTimeReferenceEntriesRouter.delete("/:id", deleteOverTimeReferenceEntries);

export default OverTimeReferenceEntriesRouter;