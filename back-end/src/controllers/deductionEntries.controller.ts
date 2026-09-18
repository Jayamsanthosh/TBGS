import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllDeductionEntriesService,
  getDeductionEntriesByIdService,
  saveDeductionEntriesService,
  updateDeductionEntriesService,
  deleteDeductionEntriesService,
  DeductionEntriesData,
} from "../services/deductionEntries.services";
import { getAllowedCompanyIds } from "../services/auth.services";

export const getAllDeductionEntries = async (req: Request, res: Response): Promise<void> => {
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
    const entries = await getAllDeductionEntriesService(status, allowedCompanyIds);
    res.json({ success: true, count: entries.length, data: entries });
  } catch (error: any) {
    console.error("GetAllDeductionEntries error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getDeductionEntriesById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "DED_REF_ID is required" });
    return;
  }

  try {
    const entry = await getDeductionEntriesByIdService(parseInt(id as string, 10));

    if (!entry) {
      res.status(404).json({ success: false, message: "Deduction entry not found" });
      return;
    }

    res.json({ success: true, data: entry });
  } catch (error: any) {
    console.error("GetDeductionEntriesById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveDeductionEntries = async (req: Request, res: Response): Promise<void> => {
  const entryData: DeductionEntriesData = req.body;

  if (!entryData.REQUEST_REF_NO) {
    res.status(400).json({ success: false, message: "Request Reference No is required" });
    return;
  }

  try {
    const result = await saveDeductionEntriesService(entryData);
    res.json({
      success: true,
      message: result.message || "Data saved successfully",
      DED_REF_ID: result.DED_REF_ID,
    });
  } catch (error: any) {
    console.error("SaveDeductionEntries error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateDeductionEntries = async (req: Request, res: Response): Promise<void> => {
  const entryData: DeductionEntriesData = req.body;
  const { id } = req.params;

  try {
    if (!entryData.DED_REF_ID && id) {
      entryData.DED_REF_ID = parseInt(id as string, 10);
    }

    const result = await updateDeductionEntriesService(entryData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateDeductionEntries error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteDeductionEntries = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "DED_REF_ID is required" });
    return;
  }

  try {
    const result = await deleteDeductionEntriesService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteDeductionEntries error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
