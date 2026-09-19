import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllAttendanceDetailsService,
  getAttendanceDetailsByIdService,
  saveAttendanceDetailsService,
  updateAttendanceDetailsService,
  deleteAttendanceDetailsService,
  submitAttendanceDetailsService,
  AttendanceDetailsData
} from "../services/attendanceDetails.services";
import { getAllowedCompanyIds } from "../services/auth.services";

export const getAllAttendanceDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
    const fromDate = (req.query.fromDate as string) || "";
    const toDate = (req.query.toDate as string) || "";
    const isAdmin = req.user?.role === "Admin" || req.user?.role === "Super Admin";
    let allowedCompanyIds: number[] | undefined;
    if (!isAdmin) {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }
      allowedCompanyIds = await getAllowedCompanyIds(req.user.sub);
      if (allowedCompanyIds.length === 0) {
        res.json({ success: true, count: 0, data: [] });
        return;
      }
    }
    const attendanceDetails = await getAllAttendanceDetailsService(status, allowedCompanyIds, fromDate, toDate);
    res.json({ success: true, count: attendanceDetails.length, data: attendanceDetails });
  } catch (error: any) {
    console.error("GetAllAttendanceDetails error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getAttendanceDetailsById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "SNO is required" });
    return;
  }

  try {
    const attendanceDetail = await getAttendanceDetailsByIdService(parseInt(id as string, 10));

    if (!attendanceDetail) {
      res.status(404).json({ success: false, message: "Attendance detail not found" });
      return;
    }

    res.json({ success: true, data: attendanceDetail });
  } catch (error: any) {
    console.error("GetAttendanceDetailsById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveAttendanceDetails = async (req: Request, res: Response): Promise<void> => {
  const attendanceDetailData: AttendanceDetailsData = req.body;

  if (!attendanceDetailData.ATT_REQUEST_REF_NO) {
    res.status(400).json({ success: false, message: "Attendance Request Ref No is required" });
    return;
  }

  try {
    const result = await saveAttendanceDetailsService(attendanceDetailData);
    res.json({
      success: true,
      message: result.message || "Data saved successfully",
      SNO: result.SNO,
    });
  } catch (error: any) {
    console.error("SaveAttendanceDetails error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateAttendanceDetails = async (req: Request, res: Response): Promise<void> => {
  const attendanceDetailData: AttendanceDetailsData = req.body;
  const { id } = req.params;

  try {
    if (!attendanceDetailData.SNO && id) {
      attendanceDetailData.SNO = parseInt(id as string, 10);
    }

    const result = await updateAttendanceDetailsService(attendanceDetailData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateAttendanceDetails error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const submitAttendanceDetails = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { ROLE } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "SNO is required" });
    return;
  }

  try {
    const result = await submitAttendanceDetailsService(parseInt(id as string, 10), ROLE as string);
    res.json({ success: true, message: result.message || "Attendance detail submitted successfully" });
  } catch (error: any) {
    console.error("SubmitAttendanceDetails error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteAttendanceDetails = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "SNO is required" });
    return;
  }

  try {
    const result = await deleteAttendanceDetailsService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteAttendanceDetails error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};