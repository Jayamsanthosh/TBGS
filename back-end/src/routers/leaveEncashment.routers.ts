import express from "express";
import {
  getAllLeaveEncashmentRequest,
  getLeaveEncashmentRequestById,
  saveLeaveEncashmentRequest,
  updateLeaveEncashmentRequest,
  deleteLeaveEncashmentRequest,
} from "../controllers/leaveEncashment.controller";

const LeaveEncashmentRouter = express.Router();

LeaveEncashmentRouter.get("/", getAllLeaveEncashmentRequest);
LeaveEncashmentRouter.get("/:id", getLeaveEncashmentRequestById);
LeaveEncashmentRouter.post("/", saveLeaveEncashmentRequest);
LeaveEncashmentRouter.put("/:id", updateLeaveEncashmentRequest);
LeaveEncashmentRouter.delete("/:id", deleteLeaveEncashmentRequest);

export default LeaveEncashmentRouter;