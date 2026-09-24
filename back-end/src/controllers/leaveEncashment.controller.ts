import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllLeaveEncashmentRequestsService,
  getLeaveEncashmentRequestByIdService,
  saveLeaveEncashmentRequestService,
  updateLeaveEncashmentRequestService,
  deleteLeaveEncashmentRequestService,
  type LeaveEncashmentData,
} from "../services/leaveEncashment.services";
import { getAllowedCompanyIds } from "../services/auth.services";

const VALID_STATUSES = ["AC", "IN", "CL"];

export const getAllLeaveEncashmentRequest = async (req: Request, res: Response): Promise<void> => {
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
    const items = await getAllLeaveEncashmentRequestsService(status, allowedCompanyIds, pendingOnly);
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllLeaveEncashmentRequest error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getLeaveEncashmentRequestById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Ref no is required" });
    return;
  }

  try {
    const item = await getLeaveEncashmentRequestByIdService(String(id));

    if (!item) {
      res.status(404).json({ success: false, message: "Leave encashment request not found" });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetLeaveEncashmentRequestById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveLeaveEncashmentRequest = async (req: Request, res: Response): Promise<void> => {
  const data: LeaveEncashmentData = req.body;

  if (!data.EMP_ID) {
    res.status(400).json({ success: false, message: "Employee is required" });
    return;
  }
  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC, IN or CL" });
    return;
  }

  try {
    const result = await saveLeaveEncashmentRequestService(data);
    res.json({ success: true, message: result.message || "Data saved successfully", SNO: result.SNO });
  } catch (error: any) {
    console.error("SaveLeaveEncashmentRequest error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateLeaveEncashmentRequest = async (req: Request, res: Response): Promise<void> => {
  const data: LeaveEncashmentData = req.body;
  const { id } = req.params;

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC, IN or CL" });
    return;
  }

  try {
    if (!data.SNO && id) {
      data.SNO = parseInt(String(id), 10);
    }

    const result = await updateLeaveEncashmentRequestService(data);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateLeaveEncashmentRequest error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteLeaveEncashmentRequest = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Ref no is required" });
    return;
  }

  try {
    const result = await deleteLeaveEncashmentRequestService(
      String(id),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteLeaveEncashmentRequest error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};