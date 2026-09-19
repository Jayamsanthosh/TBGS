import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllLeaveEncashmentEntriesService,
  getLeaveEncashmentEntriesByIdService,
  saveLeaveEncashmentEntriesService,
  updateLeaveEncashmentEntriesService,
  submitLeaveEncashmentEntriesService,
  deleteLeaveEncashmentEntriesService,
  type LeaveEncashmentEntriesData,
} from "../services/leaveEncashmentEntries.services";
import { getAllowedCompanyIds } from "../services/auth.services";

const VALID_STATUSES = ["AC", "IN", "CL"];

export const getAllLeaveEncashmentEntries = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
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
    const fromDate = (req.query.fromDate as string) || "";
    const toDate = (req.query.toDate as string) || "";
    const items = await getAllLeaveEncashmentEntriesService(status, allowedCompanyIds, fromDate, toDate);
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllLeaveEncashmentEntries error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getLeaveEncashmentEntriesById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Ref no is required" });
    return;
  }

  try {
    const item = await getLeaveEncashmentEntriesByIdService(String(id));

    if (!item) {
      res.status(404).json({ success: false, message: "Leave encashment entry not found" });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetLeaveEncashmentEntriesById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveLeaveEncashmentEntries = async (req: Request, res: Response): Promise<void> => {
  const data: LeaveEncashmentEntriesData = req.body;

  if (!data.LEAVE_ENCASHMENT_REQUEST_REF_NO) {
    res.status(400).json({ success: false, message: "Leave encashment request reference no is required" });
    return;
  }
  if (!data.EMP_ID) {
    res.status(400).json({ success: false, message: "Employee is required" });
    return;
  }
  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC, IN or CL" });
    return;
  }

  try {
    const result = await saveLeaveEncashmentEntriesService(data);
    res.json({
      success: true,
      message: result.message || "Data saved successfully",
      SNO: result.SNO,
      LEAVE_ENCASHMENT_REQUEST_REF_NO: result.LEAVE_ENCASHMENT_REQUEST_REF_NO,
    });
  } catch (error: any) {
    console.error("SaveLeaveEncashmentEntries error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateLeaveEncashmentEntries = async (req: Request, res: Response): Promise<void> => {
  const data: LeaveEncashmentEntriesData = req.body;
  const { id } = req.params;

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC, IN or CL" });
    return;
  }

  try {
    if (!data.SNO && id) {
      data.SNO = parseInt(String(id), 10);
    }

    const result = await updateLeaveEncashmentEntriesService(data);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateLeaveEncashmentEntries error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const submitLeaveEncashmentEntries = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { Role } = req.body;

  if (!id) {
    res.status(400).json({ success: false, message: "Ref no is required" });
    return;
  }

  try {
    const result = await submitLeaveEncashmentEntriesService(String(id), Role as string);
    res.json({ success: true, message: result.message || "Leave encashment entries submitted successfully" });
  } catch (error: any) {
    console.error("SubmitLeaveEncashmentEntries error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteLeaveEncashmentEntries = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Ref no is required" });
    return;
  }

  try {
    const result = await deleteLeaveEncashmentEntriesService(
      String(id),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteLeaveEncashmentEntries error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
