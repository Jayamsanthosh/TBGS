import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllMappingService,
  getMappingByIdService,
  saveMappingService,
  updateMappingService,
  deleteMappingService,
  type CompanyCampStoreMappingData,
} from "../services/companyCampStoreMapping.services";

export const getAllMapping = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const items = await getAllMappingService(status || undefined);
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllMapping error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getMappingById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "MAP_ID is required" });
    return;
  }

  try {
    const item = await getMappingByIdService(parseInt(id as string, 10));

    if (!item) {
      res.status(404).json({ success: false, message: "Mapping not found" });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetMappingById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

const VALID_STATUSES = ["AC", "IA"];

export const saveMapping = async (req: Request, res: Response): Promise<void> => {
  const data: CompanyCampStoreMappingData = req.body;

  if (!data.COMPANY_ID) {
    res.status(400).json({ success: false, message: "Company is required" });
    return;
  }

  if (!data.CAMP_ID) {
    res.status(400).json({ success: false, message: "Camp is required" });
    return;
  }

  if (!data.STORE_ID) {
    res.status(400).json({ success: false, message: "Store is required" });
    return;
  }

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER.toUpperCase())) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    const result = await saveMappingService(data);
    res.json({ success: true, message: result.message || "Data saved successfully", MAP_ID: result.MAP_ID });
  } catch (error: any) {
    console.error("SaveMapping error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateMapping = async (req: Request, res: Response): Promise<void> => {
  const data: CompanyCampStoreMappingData = req.body;
  const { id } = req.params;

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER.toUpperCase())) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    if (!data.MAP_ID && id) {
      data.MAP_ID = parseInt(id as string, 10);
    }

    const result = await updateMappingService(data);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateMapping error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteMapping = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "MAP_ID is required" });
    return;
  }

  try {
    const result = await deleteMappingService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteMapping error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
