import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllTrailerTypeMasterService,
  getTrailerTypeMasterByIdService,
  saveTrailerTypeMasterService,
  updateTrailerTypeMasterService,
  deleteTrailerTypeMasterService,
  TrailerTypeMasterData
} from "../services/trailerTypeMaster.services";

export const getAllTrailerTypeMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const trailerTypes = await getAllTrailerTypeMasterService();
    res.json({ success: true, count: trailerTypes.length, data: trailerTypes });
  } catch (error: any) {
    console.error("GetAllTrailerTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getTrailerTypeMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ success: false, message: "Trailer Type ID is required" });
    return;
  }
  try {
    const trailerType = await getTrailerTypeMasterByIdService(parseInt(id as string, 10));
    if (!trailerType) {
      res.status(404).json({ success: false, message: "Trailer type not found" });
      return;
    }
    res.json({ success: true, data: trailerType });
  } catch (error: any) {
    console.error("GetTrailerTypeMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveTrailerTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const trailerTypeData: TrailerTypeMasterData = req.body;
  if (!trailerTypeData.TRAILER_TYPE_NAME) {
    res.status(400).json({ success: false, message: "Trailer Type Name is required" });
    return;
  }
  try {
    const result = await saveTrailerTypeMasterService(trailerTypeData);
    res.json({ success: true, message: result.message || "Trailer type saved successfully" });
  } catch (error: any) {
    console.error("SaveTrailerTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateTrailerTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const trailerTypeData: TrailerTypeMasterData = req.body;
  const { id } = req.params;
  try {
    if (!trailerTypeData.TRAILER_TYPE_ID && id) {
      trailerTypeData.TRAILER_TYPE_ID = parseInt(id as string, 10);
    }
    const result = await updateTrailerTypeMasterService(trailerTypeData);
    res.json({ success: true, message: result.message || "Trailer type updated successfully" });
  } catch (error: any) {
    console.error("UpdateTrailerTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteTrailerTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);
  if (!id) {
    res.status(400).json({ success: false, message: "Trailer Type ID is required" });
    return;
  }
  try {
    const result = await deleteTrailerTypeMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Trailer type deleted successfully" });
  } catch (error: any) {
    console.error("DeleteTrailerTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
