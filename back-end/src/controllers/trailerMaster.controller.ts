import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllTrailerMasterService,
  getTrailerMasterByIdService,
  saveTrailerMasterService,
  updateTrailerMasterService,
  deleteTrailerMasterService,
  TrailerMasterData
} from "../services/trailerMaster.services";

const parseId = (raw: unknown): number | null => {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const authFrom = identityFrom;

export const getAllTrailerMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const trailers = await getAllTrailerMasterService();
    res.json({ success: true, count: trailers.length, data: trailers });
  } catch (error: any) {
    console.error("GetAllTrailerMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getTrailerMasterById = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, message: "A valid Trailer ID is required" });
    return;
  }
  try {
    const trailer = await getTrailerMasterByIdService(id);
    if (!trailer) {
      res.status(404).json({ success: false, message: "Trailer not found" });
      return;
    }
    res.json({ success: true, data: trailer });
  } catch (error: any) {
    console.error("GetTrailerMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveTrailerMaster = async (req: Request, res: Response): Promise<void> => {
  const trailerData: TrailerMasterData = req.body;
  if (!trailerData.TRAILER_NO) {
    res.status(400).json({ success: false, message: "Trailer No is required" });
    return;
  }
  try {
    const result = await saveTrailerMasterService(trailerData);
    res.json({ success: true, message: result.message || "Trailer saved successfully", TRAILER_ID: result.TRAILER_ID });
  } catch (error: any) {
    console.error("SaveTrailerMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateTrailerMaster = async (req: Request, res: Response): Promise<void> => {
  const trailerData: TrailerMasterData = req.body;
  const id = parseId(req.params.id) ?? parseId(String(trailerData.TRAILER_ID ?? ""));
  if (!id) {
    res.status(400).json({ success: false, message: "A valid Trailer ID is required" });
    return;
  }
  try {
    trailerData.TRAILER_ID = id;
    const result = await updateTrailerMasterService(trailerData);
    res.json({ success: true, message: result.message || "Trailer updated successfully" });
  } catch (error: any) {
    console.error("UpdateTrailerMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteTrailerMaster = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, message: "A valid Trailer ID is required" });
    return;
  }
  try {
    const { USER, ROLE, MAC_ADDRESS } = authFrom(req);
    const result = await deleteTrailerMasterService(id, USER, ROLE, MAC_ADDRESS);
    res.json({ success: true, message: result.message || "Trailer deleted successfully" });
  } catch (error: any) {
    console.error("DeleteTrailerMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
