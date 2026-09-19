import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllVatPercentageSettingService,
  getVatPercentageSettingByIdService,
  saveVatPercentageSettingService,
  updateVatPercentageSettingService,
  deleteVatPercentageSettingService,
  VatPercentageSettingData
} from "../services/vatPercentageSetting.services";

export const getAllVatPercentageSetting = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || 'AC';
    const records = await getAllVatPercentageSettingService(status);
    res.json({ success: true, count: records.length, data: records });
  } catch (error: any) {
    console.error("GetAllVatPercentageSetting error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getVatPercentageSettingById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "SNO is required" });
    return;
  }

  try {
    const record = await getVatPercentageSettingByIdService(parseInt(id as string, 10));
    if (!record) {
      res.status(404).json({ success: false, message: "VAT percentage setting not found" });
      return;
    }
    res.json({ success: true, data: record });
  } catch (error: any) {
    console.error("GetVatPercentageSettingById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveVatPercentageSetting = async (req: Request, res: Response): Promise<void> => {
  const data: VatPercentageSettingData = req.body;

  if (data.VAT_PERCENTAGE == null) {
    res.status(400).json({ success: false, message: "VAT percentage is required" });
    return;
  }

  if (!data.EFFECTIVE_FROM) {
    res.status(400).json({ success: false, message: "Effective from date is required" });
    return;
  }

  try {
    const result = await saveVatPercentageSettingService(data);
    res.json({ success: true, message: result.message || "Data saved successfully", SNO: result.SNO });
  } catch (error: any) {
    console.error("SaveVatPercentageSetting error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateVatPercentageSetting = async (req: Request, res: Response): Promise<void> => {
  const data: VatPercentageSettingData = req.body;
  const { id } = req.params;

  try {
    if (!data.SNO && id) {
      data.SNO = parseInt(id as string, 10);
    }
    const result = await updateVatPercentageSettingService(data);
    res.json({ success: true, message: result.message || "Record updated successfully", SNO: result.SNO });
  } catch (error: any) {
    console.error("UpdateVatPercentageSetting error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteVatPercentageSetting = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "SNO is required" });
    return;
  }

  try {
    const { USER: user, ROLE: role, MAC_ADDRESS: macAddress } = identityFrom(req);
    const result = await deleteVatPercentageSettingService(parseInt(id as string, 10), user, role, macAddress);
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteVatPercentageSetting error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
