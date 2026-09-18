import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllManPowerApprovedSettingsService,
  getManPowerApprovedSettingsByIdService,
  saveManPowerApprovedSettingsService,
  updateManPowerApprovedSettingsService,
  deleteManPowerApprovedSettingsService,
  type ManPowerApprovedSettingsData,
} from "../services/manPowerApprovedSettings.services";

const VALID_STATUSES = ["AC", "IA"];

export const getAllManPowerApprovedSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const items = await getAllManPowerApprovedSettingsService(status || undefined);
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllManPowerApprovedSettings error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getManPowerApprovedSettingsById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Man power approved settings ID is required" });
    return;
  }

  try {
    const item = await getManPowerApprovedSettingsByIdService(parseInt(id as string, 10));

    if (!item) {
      res.status(404).json({ success: false, message: "Man power approved settings not found" });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetManPowerApprovedSettingsById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveManPowerApprovedSettings = async (req: Request, res: Response): Promise<void> => {
  const data: ManPowerApprovedSettingsData = req.body;

  if (!data.COMPANY_ID) {
    res.status(400).json({ success: false, message: "Company is required" });
    return;
  }
  if (!data.DEPARTMENT_ID) {
    res.status(400).json({ success: false, message: "Department is required" });
    return;
  }
  if (!data.DESIGNATION_ID) {
    res.status(400).json({ success: false, message: "Designation is required" });
    return;
  }
  if (!data.EMPLOYMENT_TYPE_ID) {
    res.status(400).json({ success: false, message: "Employment type is required" });
    return;
  }
  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    const result = await saveManPowerApprovedSettingsService(data);
    res.json({
      success: true,
      message: result.message || "Data saved successfully",
      MAN_POWER_APPROVED_ID: result.MAN_POWER_APPROVED_ID,
    });
  } catch (error: any) {
    console.error("SaveManPowerApprovedSettings error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateManPowerApprovedSettings = async (req: Request, res: Response): Promise<void> => {
  const data: ManPowerApprovedSettingsData = req.body;
  const { id } = req.params;

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    if (!data.MAN_POWER_APPROVED_ID && id) {
      data.MAN_POWER_APPROVED_ID = parseInt(id as string, 10);
    }

    const result = await updateManPowerApprovedSettingsService(data);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateManPowerApprovedSettings error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteManPowerApprovedSettings = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Man power approved settings ID is required" });
    return;
  }

  try {
    const result = await deleteManPowerApprovedSettingsService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteManPowerApprovedSettings error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
