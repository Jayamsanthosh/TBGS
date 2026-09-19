import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllLicensePermitCostService,
  getLicensePermitCostByIdService,
  saveLicensePermitCostService,
  updateLicensePermitCostService,
  deleteLicensePermitCostService,
  LicensePermitCostData
} from "../services/licensePermitCost.services";

export const getAllLicensePermitCost = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const items = await getAllLicensePermitCostService(status);
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllLicensePermitCost error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getLicensePermitCostById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ success: false, message: "SNO is required" });
    return;
  }
  try {
    const item = await getLicensePermitCostByIdService(parseInt(id as string, 10));
    if (!item) {
      res.status(404).json({ success: false, message: "License permit cost not found" });
      return;
    }
    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetLicensePermitCostById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveLicensePermitCost = async (req: Request, res: Response): Promise<void> => {
  const data: LicensePermitCostData = req.body;
  try {
    const result = await saveLicensePermitCostService(data);
    res.json({ success: true, message: result.message || "License permit cost saved successfully" });
  } catch (error: any) {
    console.error("SaveLicensePermitCost error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateLicensePermitCost = async (req: Request, res: Response): Promise<void> => {
  const data: LicensePermitCostData = req.body;
  const { id } = req.params;
  try {
    if (!data.SNO && id) {
      data.SNO = parseInt(id as string, 10);
    }
    const result = await updateLicensePermitCostService(data);
    res.json({ success: true, message: result.message || "License permit cost updated successfully" });
  } catch (error: any) {
    console.error("UpdateLicensePermitCost error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteLicensePermitCost = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);
  if (!id) {
    res.status(400).json({ success: false, message: "SNO is required" });
    return;
  }
  try {
    const result = await deleteLicensePermitCostService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "License permit cost deleted successfully" });
  } catch (error: any) {
    console.error("DeleteLicensePermitCost error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
