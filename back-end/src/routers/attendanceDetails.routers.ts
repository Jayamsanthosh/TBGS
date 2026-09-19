import express from "express";
import {
  getAllAttendanceDetails,
  getAttendanceDetailsById,
  saveAttendanceDetails,
  updateAttendanceDetails,
  deleteAttendanceDetails,
  submitAttendanceDetails
} from "../controllers/attendanceDetails.controller";

const AttendanceDetailsRouter = express.Router();

AttendanceDetailsRouter.get("/", getAllAttendanceDetails);
AttendanceDetailsRouter.get("/:id", getAttendanceDetailsById);
AttendanceDetailsRouter.post("/:id/submit", submitAttendanceDetails);
AttendanceDetailsRouter.post("/", saveAttendanceDetails);
AttendanceDetailsRouter.put("/:id", updateAttendanceDetails);
AttendanceDetailsRouter.delete("/:id", deleteAttendanceDetails);

export default AttendanceDetailsRouter;