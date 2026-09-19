import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllCampMasterService,
  getCampMasterByIdService,
  saveCampMasterService,
  updateCampMasterService,
  deleteCampMasterService,
  CampMasterData
} from "../services/campMaster.services";

export const getAllCampMaster = async (_req: Request, res: Response): Promise<void> => {
  try {
    const camps = await getAllCampMasterService();
    res.json({ success: true, count: camps.length, data: camps });
  } catch (error: any) {
    console.error("GetAllCampMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getCampMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Camp ID is required" });
    return;
  }

  try {
    const camp = await getCampMasterByIdService(parseInt(id as string, 10));

    if (!camp) {
      res.status(404).json({ success: false, message: "Camp not found" });
      return;
    }

    res.json({ success: true, data: camp });
  } catch (error: any) {
    console.error("GetCampMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveCampMaster = async (req: Request, res: Response): Promise<void> => {
  const campData: CampMasterData = req.body;

  if (!campData.CAMP_NAME) {
    res.status(400).json({ success: false, message: "Camp Name is required" });
    return;
  }

  try {
    const result = await saveCampMasterService(campData);
    res.json({ success: true, message: result.message || "Camp saved successfully" });
  } catch (error: any) {
    console.error("SaveCampMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateCampMaster = async (req: Request, res: Response): Promise<void> => {
  const campData: CampMasterData = req.body;
  const { id } = req.params;

  try {
    if (!campData.CAMP_ID && id) {
      campData.CAMP_ID = parseInt(id as string, 10);
    }

    const result = await updateCampMasterService(campData);
    res.json({ success: true, message: result.message || "Camp updated successfully" });
  } catch (error: any) {
    console.error("UpdateCampMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteCampMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Camp ID is required" });
    return;
  }

  try {
    const result = await deleteCampMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Camp deleted successfully" });
  } catch (error: any) {
    console.error("DeleteCampMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
