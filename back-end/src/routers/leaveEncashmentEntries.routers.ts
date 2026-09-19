import express from "express";
import {
  getAllLeaveEncashmentEntries,
  getLeaveEncashmentEntriesById,
  saveLeaveEncashmentEntries,
  updateLeaveEncashmentEntries,
  submitLeaveEncashmentEntries,
  deleteLeaveEncashmentEntries,
} from "../controllers/leaveEncashmentEntries.controller";

const LeaveEncashmentEntriesRouter = express.Router();

LeaveEncashmentEntriesRouter.get("/", getAllLeaveEncashmentEntries);
LeaveEncashmentEntriesRouter.get("/:id", getLeaveEncashmentEntriesById);
LeaveEncashmentEntriesRouter.post("/", saveLeaveEncashmentEntries);
LeaveEncashmentEntriesRouter.post("/:id/submit", submitLeaveEncashmentEntries);
LeaveEncashmentEntriesRouter.put("/:id", updateLeaveEncashmentEntries);
LeaveEncashmentEntriesRouter.delete("/:id", deleteLeaveEncashmentEntries);

export default LeaveEncashmentEntriesRouter;
