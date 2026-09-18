import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllRackSectionMasterService,
  getRackSectionMasterByIdService,
  saveRackSectionMasterService,
  updateRackSectionMasterService,
  deleteRackSectionMasterService,
  RackSectionMasterData
} from "../services/rackSectionMaster.services";

export const getAllRackSectionMaster = async (_req: Request, res: Response): Promise<void> => {
  try {
    const records = await getAllRackSectionMasterService();
    res.json({ success: true, count: records.length, data: records });
  } catch (error: any) {
    console.error("GetAllRackSectionMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getRackSectionMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "RACK_SECTION_ID is required" });
    return;
  }

  try {
    const record = await getRackSectionMasterByIdService(parseInt(id as string, 10));
    if (!record) {
      res.status(404).json({ success: false, message: "Rack section not found" });
      return;
    }
    res.json({ success: true, data: record });
  } catch (error: any) {
    console.error("GetRackSectionMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveRackSectionMaster = async (req: Request, res: Response): Promise<void> => {
  const data: RackSectionMasterData = req.body;

  if (!data.RACK_SECTION_NAME) {
    res.status(400).json({ success: false, message: "Rack section name is required" });
    return;
  }

  if (data.RACK_SECTION_NAME.length > 10) {
    res.status(400).json({ success: false, message: "Rack section name must be 10 characters or less" });
    return;
  }

  try {
    const result = await saveRackSectionMasterService(data);
    res.json({ success: true, message: result.message || "Data saved successfully", RACK_SECTION_ID: result.RACK_SECTION_ID });
  } catch (error: any) {
    console.error("SaveRackSectionMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateRackSectionMaster = async (req: Request, res: Response): Promise<void> => {
  const data: RackSectionMasterData = req.body;
  const { id } = req.params;

  try {
    if (!data.RACK_SECTION_ID && id) {
      data.RACK_SECTION_ID = parseInt(id as string, 10);
    }
    const result = await updateRackSectionMasterService(data);
    res.json({ success: true, message: result.message || "Record updated successfully", RACK_SECTION_ID: result.RACK_SECTION_ID });
  } catch (error: any) {
    console.error("UpdateRackSectionMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteRackSectionMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "RACK_SECTION_ID is required" });
    return;
  }

  try {
    const { USER: user, ROLE: role, MAC_ADDRESS: macAddress } = identityFrom(req);
    const result = await deleteRackSectionMasterService(parseInt(id as string, 10), user, role, macAddress);
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteRackSectionMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
