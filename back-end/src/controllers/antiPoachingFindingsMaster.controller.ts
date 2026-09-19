import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllAntiPoachingFindingsMasterService,
  getAntiPoachingFindingsMasterByIdService,
  saveAntiPoachingFindingsMasterService,
  updateAntiPoachingFindingsMasterService,
  deleteAntiPoachingFindingsMasterService,
  AntiPoachingFindingsMasterData
} from "../services/antiPoachingFindingsMaster.services";

export const getAllAntiPoachingFindingsMaster = async (_req: Request, res: Response): Promise<void> => {
  try {
    const records = await getAllAntiPoachingFindingsMasterService();
    res.json({ success: true, count: records.length, data: records });
  } catch (error: any) {
    console.error("GetAllAntiPoachingFindingsMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getAntiPoachingFindingsMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "ANTI_POACHING_FINDINGS_ID is required" });
    return;
  }

  try {
    const record = await getAntiPoachingFindingsMasterByIdService(parseInt(id as string, 10));
    if (!record) {
      res.status(404).json({ success: false, message: "Anti-poaching findings not found" });
      return;
    }
    res.json({ success: true, data: record });
  } catch (error: any) {
    console.error("GetAntiPoachingFindingsMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveAntiPoachingFindingsMaster = async (req: Request, res: Response): Promise<void> => {
  const data: AntiPoachingFindingsMasterData = req.body;

  if (!data.ANTI_POACHING_FINDINGS_NAME) {
    res.status(400).json({ success: false, message: "Findings name is required" });
    return;
  }

  try {
    const result = await saveAntiPoachingFindingsMasterService(data);
    res.json({ success: true, message: result.message || "Data saved successfully", ANTI_POACHING_FINDINGS_ID: result.ANTI_POACHING_FINDINGS_ID });
  } catch (error: any) {
    console.error("SaveAntiPoachingFindingsMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateAntiPoachingFindingsMaster = async (req: Request, res: Response): Promise<void> => {
  const data: AntiPoachingFindingsMasterData = req.body;
  const { id } = req.params;

  try {
    if (!data.ANTI_POACHING_FINDINGS_ID && id) {
      data.ANTI_POACHING_FINDINGS_ID = parseInt(id as string, 10);
    }
    const result = await updateAntiPoachingFindingsMasterService(data);
    res.json({ success: true, message: result.message || "Record updated successfully", ANTI_POACHING_FINDINGS_ID: result.ANTI_POACHING_FINDINGS_ID });
  } catch (error: any) {
    console.error("UpdateAntiPoachingFindingsMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteAntiPoachingFindingsMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "ANTI_POACHING_FINDINGS_ID is required" });
    return;
  }

  try {
    const { USER: user, ROLE: role, MAC_ADDRESS: macAddress } = identityFrom(req);
    const result = await deleteAntiPoachingFindingsMasterService(parseInt(id as string, 10), user, role, macAddress);
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteAntiPoachingFindingsMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
