import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllVideographerMasterService,
  getVideographerMasterByIdService,
  saveVideographerMasterService,
  updateVideographerMasterService,
  deleteVideographerMasterService,
  type VideographerMasterData,
} from "../services/videographerMaster.services";

export const getAllVideographerMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const videographers = await getAllVideographerMasterService(status || undefined);
    res.json({ success: true, count: videographers.length, data: videographers });
  } catch (error: any) {
    console.error("GetAllVideographerMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getVideographerMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "VIDEOGRAPHER ID is required" });
    return;
  }

  try {
    const videographer = await getVideographerMasterByIdService(parseInt(id as string, 10));

    if (!videographer) {
      res.status(404).json({ success: false, message: "Videographer not found" });
      return;
    }

    res.json({ success: true, data: videographer });
  } catch (error: any) {
    console.error("GetVideographerMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

const VALID_STATUSES = ["AC", "IA"];

export const saveVideographerMaster = async (req: Request, res: Response): Promise<void> => {
  const videographerData: VideographerMasterData = req.body;

  if (!videographerData.VIDEOGRAPHER_NAME?.trim()) {
    res.status(400).json({ success: false, message: "Videographer Name is required" });
    return;
  }

  if (videographerData.STATUS_MASTER && !VALID_STATUSES.includes(videographerData.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    const result = await saveVideographerMasterService(videographerData);
    res.json({ success: true, message: result.message || "Data saved successfully", VIDEOGRAPHER_ID: result.VIDEOGRAPHER_ID });
  } catch (error: any) {
    console.error("SaveVideographerMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateVideographerMaster = async (req: Request, res: Response): Promise<void> => {
  const videographerData: VideographerMasterData = req.body;
  const { id } = req.params;

  if (videographerData.STATUS_MASTER && !VALID_STATUSES.includes(videographerData.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    if (!videographerData.VIDEOGRAPHER_ID && id) {
      videographerData.VIDEOGRAPHER_ID = parseInt(id as string, 10);
    }

    const result = await updateVideographerMasterService(videographerData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateVideographerMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteVideographerMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "VIDEOGRAPHER ID is required" });
    return;
  }

  try {
    const result = await deleteVideographerMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Data deleted successfully" });
  } catch (error: any) {
    console.error("DeleteVideographerMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
