import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllBusinessPartnerMasterService,
  getBusinessPartnerMasterByIdService,
  saveBusinessPartnerMasterService,
  updateBusinessPartnerMasterService,
  deleteBusinessPartnerMasterService,
  BusinessPartnerMasterData
} from "../services/businessPartnerMaster.services";

export const getAllBusinessPartnerMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
    const partners = await getAllBusinessPartnerMasterService(status);
    res.json({ success: true, count: partners.length, data: partners });
  } catch (error: any) {
    console.error("GetAllBusinessPartnerMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getBusinessPartnerMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "BP ID is required" });
    return;
  }

  try {
    const partner = await getBusinessPartnerMasterByIdService(parseInt(id as string, 10));

    if (!partner) {
      res.status(404).json({ success: false, message: "Business partner not found" });
      return;
    }

    res.json({ success: true, data: partner });
  } catch (error: any) {
    console.error("GetBusinessPartnerMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

const VALID_STATUSES = ["AC", "IA"];

export const saveBusinessPartnerMaster = async (req: Request, res: Response): Promise<void> => {
  const partnerData: BusinessPartnerMasterData = req.body;

  if (!partnerData.BP_NAME) {
    res.status(400).json({ success: false, message: "BP Name is required" });
    return;
  }

  if (partnerData.STATUS_MASTER && !VALID_STATUSES.includes(partnerData.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    const result = await saveBusinessPartnerMasterService(partnerData);
    res.json({ success: true, message: result.message || "Data saved successfully", BP_ID: result.BP_ID });
  } catch (error: any) {
    console.error("SaveBusinessPartnerMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateBusinessPartnerMaster = async (req: Request, res: Response): Promise<void> => {
  const partnerData: BusinessPartnerMasterData = req.body;
  const { id } = req.params;

  if (partnerData.STATUS_MASTER && !VALID_STATUSES.includes(partnerData.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    if (!partnerData.BP_ID && id) {
      partnerData.BP_ID = parseInt(id as string, 10);
    }

    const result = await updateBusinessPartnerMasterService(partnerData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateBusinessPartnerMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteBusinessPartnerMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "BP ID is required" });
    return;
  }

  try {
    const result = await deleteBusinessPartnerMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteBusinessPartnerMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
