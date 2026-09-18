import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllOvertimeRequestsService,
  getOvertimeRequestByIdService,
  saveOvertimeRequestService,
  updateOvertimeRequestService,
  deleteOvertimeRequestService,
  type OvertimeRequestData,
} from "../services/overtimeRequest.services";
import { getAllowedCompanyIds } from "../services/auth.services";

const VALID_STATUSES = ["AC", "IN"];

export const getAllOvertimeRequest = async (req: Request, res: Response): Promise<void> => {
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
    const items = await getAllOvertimeRequestsService(status, allowedCompanyIds);
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllOvertimeRequest error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getOvertimeRequestById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Ref no is required" });
    return;
  }

  try {
    const item = await getOvertimeRequestByIdService(String(id));

    if (!item) {
      res.status(404).json({ success: false, message: "Overtime request not found" });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetOvertimeRequestById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveOvertimeRequest = async (req: Request, res: Response): Promise<void> => {
  const data: OvertimeRequestData = req.body;

  if (!data.EMP_ID) {
    res.status(400).json({ success: false, message: "Employee is required" });
    return;
  }
  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IN" });
    return;
  }

  try {
    const result = await saveOvertimeRequestService(data);
    res.json({ success: true, message: result.message || "Data saved successfully", SNO: result.SNO });
  } catch (error: any) {
    console.error("SaveOvertimeRequest error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateOvertimeRequest = async (req: Request, res: Response): Promise<void> => {
  const data: OvertimeRequestData = req.body;
  const { id } = req.params;

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IN" });
    return;
  }

  try {
    if (!data.SNO && id) {
      data.SNO = parseInt(String(id), 10);
    }

    const result = await updateOvertimeRequestService(data);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateOvertimeRequest error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteOvertimeRequest = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Ref no is required" });
    return;
  }

  try {
    const result = await deleteOvertimeRequestService(
      String(id),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteOvertimeRequest error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
