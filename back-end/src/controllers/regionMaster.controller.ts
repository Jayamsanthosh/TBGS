import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllRegionMasterService,
  getRegionMasterByIdService,
  saveRegionMasterService,
  updateRegionMasterService,
  deleteRegionMasterService,
  RegionMasterData
} from "../services/regionMaster.services";

export const getAllRegionMaster = async (_req: Request, res: Response): Promise<void> => {
  try {
    const regions = await getAllRegionMasterService();
    res.json({ success: true, count: regions.length, data: regions });
  } catch (error: any) {
    console.error("GetAllRegionMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getRegionMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Region ID is required" });
    return;
  }

  try {
    const region = await getRegionMasterByIdService(parseInt(id as string, 10));

    if (!region) {
      res.status(404).json({ success: false, message: "Region not found" });
      return;
    }

    res.json({ success: true, data: region });
  } catch (error: any) {
    console.error("GetRegionMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveRegionMaster = async (req: Request, res: Response): Promise<void> => {
  const regionData: RegionMasterData = req.body;

  if (!regionData.REGION_NAME) {
    res.status(400).json({ success: false, message: "Region Name is required" });
    return;
  }

  try {
    const result = await saveRegionMasterService(regionData);
    res.json({ success: true, message: result.message || "Region saved successfully" });
  } catch (error: any) {
    console.error("SaveRegionMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateRegionMaster = async (req: Request, res: Response): Promise<void> => {
  const regionData: RegionMasterData = req.body;
  const { id } = req.params;

  try {
    if (!regionData.REGION_ID && id) {
      regionData.REGION_ID = parseInt(id as string, 10);
    }

    const result = await updateRegionMasterService(regionData);
    res.json({ success: true, message: result.message || "Region updated successfully" });
  } catch (error: any) {
    console.error("UpdateRegionMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteRegionMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Region ID is required" });
    return;
  }

  try {
    const result = await deleteRegionMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Region deleted successfully" });
  } catch (error: any) {
    console.error("DeleteRegionMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
