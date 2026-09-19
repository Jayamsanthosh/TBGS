import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  getAllGunSourceTypeMasterService,
  getGunSourceTypeMasterByIdService,
  saveGunSourceTypeMasterService,
  updateGunSourceTypeMasterService,
  deleteGunSourceTypeMasterService,
  type GunSourceTypeMasterData,
} from "../services/gunSourceTypeMaster.services";

export const getAllGunSourceTypeMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const items = await getAllGunSourceTypeMasterService(status || undefined);
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllGunSourceTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getGunSourceTypeMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "GUN_SOURCE_TYPE_ID is required" });
    return;
  }

  try {
    const item = await getGunSourceTypeMasterByIdService(parseInt(id as string, 10));

    if (!item) {
      res.status(404).json({ success: false, message: "Gun source type not found" });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetGunSourceTypeMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

const VALID_STATUSES = ["AC", "IN"];

export const saveGunSourceTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const data: GunSourceTypeMasterData = req.body;

  if (!data.GUN_SOURCE_TYPE_NAME?.trim()) {
    res.status(400).json({ success: false, message: "Gun source type name is required" });
    return;
  }

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IN" });
    return;
  }

  try {
    const result = await saveGunSourceTypeMasterService(data);
    res.json({ success: true, message: result.message || "Data saved successfully", GUN_SOURCE_TYPE_ID: result.GUN_SOURCE_TYPE_ID });
  } catch (error: any) {
    console.error("SaveGunSourceTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateGunSourceTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const data: GunSourceTypeMasterData = req.body;
  const { id } = req.params;

  if (!data.GUN_SOURCE_TYPE_NAME?.trim()) {
    res.status(400).json({ success: false, message: "Gun source type name is required" });
    return;
  }

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IN" });
    return;
  }

  try {
    if (!data.GUN_SOURCE_TYPE_ID && id) {
      data.GUN_SOURCE_TYPE_ID = parseInt(id as string, 10);
    }

    const result = await updateGunSourceTypeMasterService(data);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateGunSourceTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteGunSourceTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "GUN_SOURCE_TYPE_ID is required" });
    return;
  }

  try {
    const result = await deleteGunSourceTypeMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteGunSourceTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};