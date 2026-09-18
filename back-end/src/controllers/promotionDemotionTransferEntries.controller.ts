import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllPromotionDemotionTransferEntriesService,
  getPromotionDemotionTransferEntryByRefNoService,
  savePromotionDemotionTransferEntriesService,
  updatePromotionDemotionTransferEntriesService,
  deletePromotionDemotionTransferEntriesService,
  type PromotionDemotionTransferEntriesData,
} from "../services/promotionDemotionTransferEntries.services";
import { getAllowedCompanyIds } from "../services/auth.services";

export const getAllPromotionDemotionTransferEntries = async (
  req: Request,
  res: Response
): Promise<void> => {
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
    const items = await getAllPromotionDemotionTransferEntriesService(status, allowedCompanyIds);
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllPromotionDemotionTransferEntries error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPromotionDemotionTransferEntryByRefNo = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { refNo } = req.params;

  if (!refNo) {
    res.status(400).json({ success: false, message: "Transfer request reference no is required" });
    return;
  }

  try {
    const item = await getPromotionDemotionTransferEntryByRefNoService(String(refNo));

    if (!item) {
      res.status(404).json({ success: false, message: "Promotion / demotion / transfer entry not found" });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetPromotionDemotionTransferEntryByRefNo error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const savePromotionDemotionTransferEntry = async (
  req: Request,
  res: Response
): Promise<void> => {
  const data: PromotionDemotionTransferEntriesData = req.body;

  if (!data.TRANSFER_REQUEST_REF_NO) {
    res.status(400).json({ success: false, message: "Transfer request reference no is required" });
    return;
  }
  if (!data.NEW_COMPANY_ID) {
    res.status(400).json({ success: false, message: "New company is required" });
    return;
  }
  if (!data.EMP_ID) {
    res.status(400).json({ success: false, message: "Employee is required" });
    return;
  }
  if (!data.TRANSFER_TYPE) {
    res.status(400).json({ success: false, message: "Transfer type is required" });
    return;
  }

  try {
    const result = await savePromotionDemotionTransferEntriesService(data);
    res.json({ success: true, message: result.message || "Data saved successfully", SNO: result.SNO });
  } catch (error: any) {
    console.error("SavePromotionDemotionTransferEntry error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updatePromotionDemotionTransferEntry = async (
  req: Request,
  res: Response
): Promise<void> => {
  const data: PromotionDemotionTransferEntriesData = req.body;
  const { sno } = req.params;

  try {
    if (!data.SNO && sno) {
      data.SNO = parseInt(String(sno), 10);
    }

    const result = await updatePromotionDemotionTransferEntriesService(data);
    res.json({ success: true, message: result.message || "Data updated successfully" });
  } catch (error: any) {
    console.error("UpdatePromotionDemotionTransferEntry error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deletePromotionDemotionTransferEntry = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { refNo } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!refNo) {
    res.status(400).json({ success: false, message: "Transfer request reference no is required" });
    return;
  }

  try {
    const result = await deletePromotionDemotionTransferEntriesService(
      String(refNo),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Data deleted successfully" });
  } catch (error: any) {
    console.error("DeletePromotionDemotionTransferEntry error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
