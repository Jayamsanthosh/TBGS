import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllDistrictMasterService,
  getDistrictMasterByIdService,
  saveDistrictMasterService,
  updateDistrictMasterService,
  deleteDistrictMasterService,
  DistrictMasterData
} from "../services/districtMaster.services";

export const getAllDistrictMaster = async (_req: Request, res: Response): Promise<void> => {
  try {
    const districts = await getAllDistrictMasterService();
    res.json({ success: true, count: districts.length, data: districts });
  } catch (error: any) {
    console.error("GetAllDistrictMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getDistrictMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "District ID is required" });
    return;
  }

  try {
    const district = await getDistrictMasterByIdService(parseInt(id as string, 10));

    if (!district) {
      res.status(404).json({ success: false, message: "District not found" });
      return;
    }

    res.json({ success: true, data: district });
  } catch (error: any) {
    console.error("GetDistrictMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveDistrictMaster = async (req: Request, res: Response): Promise<void> => {
  const districtData: DistrictMasterData = req.body;

  if (!districtData.DISTRICT_NAME) {
    res.status(400).json({ success: false, message: "District Name is required" });
    return;
  }

  try {
    const result = await saveDistrictMasterService(districtData);
    res.json({ success: true, message: result.message || "District saved successfully" });
  } catch (error: any) {
    console.error("SaveDistrictMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateDistrictMaster = async (req: Request, res: Response): Promise<void> => {
  const districtData: DistrictMasterData = req.body;
  const { id } = req.params;

  try {
    if (!districtData.District_id && id) {
      districtData.District_id = parseInt(id as string, 10);
    }

    const result = await updateDistrictMasterService(districtData);
    res.json({ success: true, message: result.message || "District updated successfully" });
  } catch (error: any) {
    console.error("UpdateDistrictMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteDistrictMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "District ID is required" });
    return;
  }

  try {
    const result = await deleteDistrictMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "District deleted successfully" });
  } catch (error: any) {
    console.error("DeleteDistrictMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
