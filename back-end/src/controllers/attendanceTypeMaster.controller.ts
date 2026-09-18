import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllAttendanceTypeMasterService,
  getAttendanceTypeMasterByIdService,
  saveAttendanceTypeMasterService,
  updateAttendanceTypeMasterService,
  deleteAttendanceTypeMasterService,
  AttendanceTypeMasterData
} from "../services/attendanceTypeMaster.services";

export const getAllAttendanceTypeMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
    const attendanceTypes = await getAllAttendanceTypeMasterService(status);
    res.json({ success: true, count: attendanceTypes.length, data: attendanceTypes });
  } catch (error: any) {
    console.error("GetAllAttendanceTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getAttendanceTypeMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Attendance Type ID is required" });
    return;
  }

  try {
    const attendanceType = await getAttendanceTypeMasterByIdService(parseInt(id as string, 10));

    if (!attendanceType) {
      res.status(404).json({ success: false, message: "Attendance type not found" });
      return;
    }

    res.json({ success: true, data: attendanceType });
  } catch (error: any) {
    console.error("GetAttendanceTypeMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveAttendanceTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const attendanceTypeData: AttendanceTypeMasterData = req.body;

  if (!attendanceTypeData.ATTENDANCE_TYPE_NAME) {
    res.status(400).json({ success: false, message: "Attendance Type Name is required" });
    return;
  }

  try {
    const result = await saveAttendanceTypeMasterService(attendanceTypeData);
    res.json({
      success: true,
      message: result.message || "Data saved successfully",
      ATTENDANCE_TYPE_ID: result.ATTENDANCE_TYPE_ID,
    });
  } catch (error: any) {
    console.error("SaveAttendanceTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateAttendanceTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const attendanceTypeData: AttendanceTypeMasterData = req.body;
  const { id } = req.params;

  try {
    if (!attendanceTypeData.ATTENDANCE_TYPE_ID && id) {
      attendanceTypeData.ATTENDANCE_TYPE_ID = parseInt(id as string, 10);
    }

    const result = await updateAttendanceTypeMasterService(attendanceTypeData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateAttendanceTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteAttendanceTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Attendance Type ID is required" });
    return;
  }

  try {
    const result = await deleteAttendanceTypeMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteAttendanceTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};