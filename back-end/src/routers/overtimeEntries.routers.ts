import express from "express";
import {
  getAllOvertimeEntries,
  getOvertimeEntriesById,
  saveOvertimeEntries,
  updateOvertimeEntries,
  deleteOvertimeEntries,
} from "../controllers/overtimeEntries.controller";

const OvertimeEntriesRouter = express.Router();

OvertimeEntriesRouter.get("/", getAllOvertimeEntries);
OvertimeEntriesRouter.get("/:id", getOvertimeEntriesById);
OvertimeEntriesRouter.post("/", saveOvertimeEntries);
OvertimeEntriesRouter.put("/:id", updateOvertimeEntries);
OvertimeEntriesRouter.delete("/:id", deleteOvertimeEntries);

export default OvertimeEntriesRouter;
