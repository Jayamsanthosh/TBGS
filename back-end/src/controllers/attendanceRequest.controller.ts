import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllAttendanceRequestService,
  getAttendanceRequestByIdService,
  saveAttendanceRequestService,
  updateAttendanceRequestService,
  deleteAttendanceRequestService,
  type AttendanceRequestData,
} from "../services/attendanceRequest.services";
import { getAllowedCompanyIds } from "../services/auth.services";

const VALID_STATUSES = ["AC", "IN"];

export const getAllAttendanceRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
    const pendingOnly =
      req.query.pendingOnly === "1" || req.query.pendingOnly === "true" || req.query.pendingOnly === "yes";
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
    const items = await getAllAttendanceRequestService(status, allowedCompanyIds, pendingOnly);
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllAttendanceRequest error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getAttendanceRequestById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "SNO is required" });
    return;
  }

  try {
    const item = await getAttendanceRequestByIdService(parseInt(id as string, 10));

    if (!item) {
      res.status(404).json({ success: false, message: "Attendance request not found" });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetAttendanceRequestById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveAttendanceRequest = async (req: Request, res: Response): Promise<void> => {
  const data: AttendanceRequestData = req.body;

  if (!data.EMP_ID) {
    res.status(400).json({ success: false, message: "Employee is required" });
    return;
  }
  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IN" });
    return;
  }

  try {
    const result = await saveAttendanceRequestService(data);
    res.json({ success: true, message: result.message || "Data saved successfully", SNO: result.SNO });
  } catch (error: any) {
    console.error("SaveAttendanceRequest error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateAttendanceRequest = async (req: Request, res: Response): Promise<void> => {
  const data: AttendanceRequestData = req.body;
  const { id } = req.params;

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IN" });
    return;
  }

  try {
    if (!data.SNO && id) {
      data.SNO = parseInt(id as string, 10);
    }

    const result = await updateAttendanceRequestService(data);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateAttendanceRequest error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteAttendanceRequest = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "SNO is required" });
    return;
  }

  try {
    const result = await deleteAttendanceRequestService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteAttendanceRequest error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
