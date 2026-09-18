import express from "express";
import {
  getAllAttendanceTypeMaster,
  getAttendanceTypeMasterById,
  saveAttendanceTypeMaster,
  updateAttendanceTypeMaster,
  deleteAttendanceTypeMaster
} from "../controllers/attendanceTypeMaster.controller";

const AttendanceTypeMasterRouter = express.Router();

AttendanceTypeMasterRouter.get("/", getAllAttendanceTypeMaster);
AttendanceTypeMasterRouter.get("/:id", getAttendanceTypeMasterById);
AttendanceTypeMasterRouter.post("/", saveAttendanceTypeMaster);
AttendanceTypeMasterRouter.put("/:id", updateAttendanceTypeMaster);
AttendanceTypeMasterRouter.delete("/:id", deleteAttendanceTypeMaster);

export default AttendanceTypeMasterRouter;