import express from "express";
import {
  getAllAttendanceRequest,
  getAttendanceRequestById,
  saveAttendanceRequest,
  updateAttendanceRequest,
  deleteAttendanceRequest,
} from "../controllers/attendanceRequest.controller";

const AttendanceRequestRouter = express.Router();

AttendanceRequestRouter.get("/", getAllAttendanceRequest);
AttendanceRequestRouter.get("/:id", getAttendanceRequestById);
AttendanceRequestRouter.post("/", saveAttendanceRequest);
AttendanceRequestRouter.put("/:id", updateAttendanceRequest);
AttendanceRequestRouter.delete("/:id", deleteAttendanceRequest);

export default AttendanceRequestRouter;
