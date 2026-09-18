import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllOvertimeEntriesService,
  getOvertimeEntriesByIdService,
  saveOvertimeEntriesService,
  updateOvertimeEntriesService,
  deleteOvertimeEntriesService,
  type OvertimeEntriesData,
} from "../services/overtimeEntries.services";
import { getAllowedCompanyIds } from "../services/auth.services";

const VALID_STATUSES = ["AC", "IN", "CL"];

export const getAllOvertimeEntries = async (req: Request, res: Response): Promise<void> => {
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
    const items = await getAllOvertimeEntriesService(status, allowedCompanyIds);
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllOvertimeEntries error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getOvertimeEntriesById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Ref no is required" });
    return;
  }

  try {
    const item = await getOvertimeEntriesByIdService(String(id));

    if (!item) {
      res.status(404).json({ success: false, message: "Overtime entry not found" });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetOvertimeEntriesById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveOvertimeEntries = async (req: Request, res: Response): Promise<void> => {
  const data: OvertimeEntriesData = req.body;

  if (!data.EMP_ID) {
    res.status(400).json({ success: false, message: "Employee is required" });
    return;
  }
  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC, IN or CL" });
    return;
  }

  try {
    const result = await saveOvertimeEntriesService(data);
    res.json({
      success: true,
      message: result.message || "Data saved successfully",
      SNO: result.SNO,
      OT_REQUEST_REF_NO: result.OT_REQUEST_REF_NO,
    });
  } catch (error: any) {
    console.error("SaveOvertimeEntries error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateOvertimeEntries = async (req: Request, res: Response): Promise<void> => {
  const data: OvertimeEntriesData = req.body;
  const { id } = req.params;

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC, IN or CL" });
    return;
  }

  try {
    if (!data.SNO && id) {
      data.SNO = parseInt(String(id), 10);
    }

    const result = await updateOvertimeEntriesService(data);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateOvertimeEntries error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteOvertimeEntries = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Ref no is required" });
    return;
  }

  try {
    const result = await deleteOvertimeEntriesService(
      String(id),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteOvertimeEntries error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
