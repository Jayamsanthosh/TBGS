import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllMassagerMasterService,
  getMassagerMasterByIdService,
  saveMassagerMasterService,
  updateMassagerMasterService,
  deleteMassagerMasterService,
  type MassagerMasterData,
} from "../services/massagerMaster.services";

export const getAllMassagerMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const massagers = await getAllMassagerMasterService(status || undefined);
    res.json({ success: true, count: massagers.length, data: massagers });
  } catch (error: any) {
    console.error("GetAllMassagerMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getMassagerMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "MASSAGER ID is required" });
    return;
  }

  try {
    const massager = await getMassagerMasterByIdService(parseInt(id as string, 10));

    if (!massager) {
      res.status(404).json({ success: false, message: "Massager not found" });
      return;
    }

    res.json({ success: true, data: massager });
  } catch (error: any) {
    console.error("GetMassagerMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

const VALID_STATUSES = ["AC", "IA"];

export const saveMassagerMaster = async (req: Request, res: Response): Promise<void> => {
  const massagerData: MassagerMasterData = req.body;

  if (!massagerData.MASSAGER_NAME?.trim()) {
    res.status(400).json({ success: false, message: "Massager Name is required" });
    return;
  }

  if (massagerData.STATUS_MASTER && !VALID_STATUSES.includes(massagerData.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    const result = await saveMassagerMasterService(massagerData);
    res.json({ success: true, message: result.message || "Data saved successfully", MASSAGER_ID: result.MASSAGER_ID });
  } catch (error: any) {
    console.error("SaveMassagerMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateMassagerMaster = async (req: Request, res: Response): Promise<void> => {
  const massagerData: MassagerMasterData = req.body;
  const { id } = req.params;

  if (massagerData.STATUS_MASTER && !VALID_STATUSES.includes(massagerData.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    if (!massagerData.MASSAGER_ID && id) {
      massagerData.MASSAGER_ID = parseInt(id as string, 10);
    }

    const result = await updateMassagerMasterService(massagerData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateMassagerMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteMassagerMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "MASSAGER ID is required" });
    return;
  }

  try {
    const result = await deleteMassagerMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteMassagerMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
