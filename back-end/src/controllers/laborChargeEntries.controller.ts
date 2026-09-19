import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllLaborChargeEntriesService,
  getLaborChargeEntriesByIdService,
  saveLaborChargeEntriesService,
  updateLaborChargeEntriesService,
  submitLaborChargeEntriesService,
  deleteLaborChargeEntriesService,
  type LaborChargeEntriesData,
} from "../services/laborChargeEntries.services";
import { getAllowedCompanyIds } from "../services/auth.services";

const VALID_STATUSES = ["AC", "IA"];

export const getAllLaborChargeEntries = async (req: Request, res: Response): Promise<void> => {
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
    const items = await getAllLaborChargeEntriesService(status, allowedCompanyIds, fromDate, toDate);
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllLaborChargeEntries error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getLaborChargeEntriesById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "SNO is required" });
    return;
  }

  try {
    const item = await getLaborChargeEntriesByIdService(parseInt(String(id), 10));

    if (!item) {
      res.status(404).json({ success: false, message: "Labor charge entry not found" });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetLaborChargeEntriesById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveLaborChargeEntries = async (req: Request, res: Response): Promise<void> => {
  const data: LaborChargeEntriesData = req.body;

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
    const result = await saveLaborChargeEntriesService(data);
    res.json({
      success: true,
      message: result.message || "Data saved successfully",
      SNO: result.SNO,
    });
  } catch (error: any) {
    console.error("SaveLaborChargeEntries error:", error);
    res.status(400).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateLaborChargeEntries = async (req: Request, res: Response): Promise<void> => {
  const data: LaborChargeEntriesData = req.body;
  const { id } = req.params;

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    if (!data.SNO && id) {
      data.SNO = parseInt(String(id), 10);
    }

    const result = await updateLaborChargeEntriesService(data);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateLaborChargeEntries error:", error);
    res.status(400).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const submitLaborChargeEntries = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { Role } = req.body;

  if (!id) {
    res.status(400).json({ success: false, message: "SNO is required" });
    return;
  }

  try {
    const result = await submitLaborChargeEntriesService(parseInt(String(id), 10), Role as string);
    res.json({ success: true, message: result.message || "Labor charge entry submitted successfully" });
  } catch (error: any) {
    console.error("SubmitLaborChargeEntries error:", error);
    res.status(400).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteLaborChargeEntries = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "SNO is required" });
    return;
  }

  try {
    const result = await deleteLaborChargeEntriesService(
      parseInt(String(id), 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteLaborChargeEntries error:", error);
    res.status(400).json({ success: false, message: error?.message || "Internal server error" });
  }
};