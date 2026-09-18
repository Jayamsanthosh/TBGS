import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllBonusEntriesService,
  getBonusEntriesByIdService,
  saveBonusEntriesService,
  updateBonusEntriesService,
  deleteBonusEntriesService,
  submitBonusEntriesService,
  type BonusEntriesData,
} from "../services/bonusEntries.services";
import { getAllowedCompanyIds } from "../services/auth.services";

const VALID_STATUSES = ["AC", "IN", "CL"];

export const getAllBonusEntries = async (req: Request, res: Response): Promise<void> => {
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
    const items = await getAllBonusEntriesService(status, allowedCompanyIds);
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllBonusEntries error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getBonusEntriesById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Ref no is required" });
    return;
  }

  try {
    const item = await getBonusEntriesByIdService(String(id));

    if (!item) {
      res.status(404).json({ success: false, message: "Bonus entry not found" });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetBonusEntriesById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveBonusEntries = async (req: Request, res: Response): Promise<void> => {
  const data: BonusEntriesData = req.body;

  if (!data.BONUS_REQUEST_REF_NO) {
    res.status(400).json({ success: false, message: "Bonus request reference no is required" });
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
    const result = await saveBonusEntriesService(data);
    res.json({
      success: true,
      message: result.message || "Data saved successfully",
      SNO: result.SNO,
      BONUS_REQUEST_REF_NO: result.BONUS_REQUEST_REF_NO,
    });
  } catch (error: any) {
    console.error("SaveBonusEntries error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateBonusEntries = async (req: Request, res: Response): Promise<void> => {
  const data: BonusEntriesData = req.body;
  const { id } = req.params;

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC, IN or CL" });
    return;
  }

  try {
    if (!data.SNO && id) {
      data.SNO = parseInt(String(id), 10);
    }

    const result = await updateBonusEntriesService(data);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateBonusEntries error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const submitBonusEntries = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { Role } = req.body;

  if (!id) {
    res.status(400).json({ success: false, message: "Ref no is required" });
    return;
  }

  try {
    const result = await submitBonusEntriesService(String(id), Role as string);
    res.json({ success: true, message: result.message || "Bonus entries submitted successfully" });
  } catch (error: any) {
    console.error("SubmitBonusEntries error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteBonusEntries = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Ref no is required" });
    return;
  }

  try {
    const result = await deleteBonusEntriesService(
      String(id),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteBonusEntries error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};