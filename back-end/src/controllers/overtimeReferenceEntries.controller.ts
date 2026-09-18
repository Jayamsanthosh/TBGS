import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllOverTimeReferenceEntriesService,
  getOverTimeReferenceEntriesByIdService,
  saveOverTimeReferenceEntriesService,
  updateOverTimeReferenceEntriesService,
  deleteOverTimeReferenceEntriesService,
  type OverTimeReferenceEntriesData,
} from "../services/overtimeReferenceEntries.services";
import { getAllowedCompanyIds } from "../services/auth.services";

const VALID_STATUSES = ["AC", "IA"];

export const getAllOverTimeReferenceEntries = async (req: Request, res: Response): Promise<void> => {
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
    const items = await getAllOverTimeReferenceEntriesService(status, allowedCompanyIds);
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllOverTimeReferenceEntries error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getOverTimeReferenceEntriesById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Ref no is required" });
    return;
  }

  try {
    const item = await getOverTimeReferenceEntriesByIdService(String(id));

    if (!item) {
      res.status(404).json({ success: false, message: "Over time reference entry not found" });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetOverTimeReferenceEntriesById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveOverTimeReferenceEntries = async (req: Request, res: Response): Promise<void> => {
  const data: OverTimeReferenceEntriesData = req.body;

  if (!data.MONTH_ENTERED) {
    res.status(400).json({ success: false, message: "Month is required" });
    return;
  }
  if (!data.YEAR_ENTERED) {
    res.status(400).json({ success: false, message: "Year is required" });
    return;
  }
  if (!data.COMPANY_ID) {
    res.status(400).json({ success: false, message: "Company is required" });
    return;
  }
  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    const result = await saveOverTimeReferenceEntriesService(data);
    res.json({
      success: true,
      message: result.message || "Data saved successfully",
      SNO: result.SNO,
    });
  } catch (error: any) {
    console.error("SaveOverTimeReferenceEntries error:", error);
    res.status(400).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateOverTimeReferenceEntries = async (req: Request, res: Response): Promise<void> => {
  const data: OverTimeReferenceEntriesData = req.body;
  const { id } = req.params;

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    if (!data.SNO && id) {
      data.SNO = parseInt(String(id), 10);
    }

    const result = await updateOverTimeReferenceEntriesService(data);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateOverTimeReferenceEntries error:", error);
    res.status(400).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteOverTimeReferenceEntries = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Ref no is required" });
    return;
  }

  try {
    const result = await deleteOverTimeReferenceEntriesService(
      String(id),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteOverTimeReferenceEntries error:", error);
    res.status(400).json({ success: false, message: error?.message || "Internal server error" });
  }
};