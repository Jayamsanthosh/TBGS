import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllLicensePermitTypeService,
  getLicensePermitTypeByIdService,
  saveLicensePermitTypeService,
  updateLicensePermitTypeService,
  deleteLicensePermitTypeService,
  LicensePermitTypeData
} from "../services/licensePermitType.services";

export const getAllLicensePermitType = async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await getAllLicensePermitTypeService();
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllLicensePermitType error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getLicensePermitTypeById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "License Permit ID is required" });
    return;
  }

  try {
    const item = await getLicensePermitTypeByIdService(parseInt(id as string, 10));

    if (!item) {
      res.status(404).json({ success: false, message: "License permit type not found" });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetLicensePermitTypeById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveLicensePermitType = async (req: Request, res: Response): Promise<void> => {
  const data: LicensePermitTypeData = req.body;

  if (!data.LICENSE_PERMIT_NAME) {
    res.status(400).json({ success: false, message: "License Permit Name is required" });
    return;
  }

  try {
    const result = await saveLicensePermitTypeService(data);
    res.json({ success: true, message: result.message || "License permit type saved successfully" });
  } catch (error: any) {
    console.error("SaveLicensePermitType error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateLicensePermitType = async (req: Request, res: Response): Promise<void> => {
  const data: LicensePermitTypeData = req.body;
  const { id } = req.params;

  try {
    if (!data.LICENSE_PERMIT_ID && id) {
      data.LICENSE_PERMIT_ID = parseInt(id as string, 10);
    }

    const result = await updateLicensePermitTypeService(data);
    res.json({ success: true, message: result.message || "License permit type updated successfully" });
  } catch (error: any) {
    console.error("UpdateLicensePermitType error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteLicensePermitType = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "License Permit ID is required" });
    return;
  }

  try {
    const result = await deleteLicensePermitTypeService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "License permit type deleted successfully" });
  } catch (error: any) {
    console.error("DeleteLicensePermitType error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
