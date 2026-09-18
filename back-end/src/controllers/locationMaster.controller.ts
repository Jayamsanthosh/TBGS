import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllLocationMasterService,
  getLocationMasterByIdService,
  saveLocationMasterService,
  updateLocationMasterService,
  deleteLocationMasterService,
  LocationMasterData
} from "../services/locationMaster.services";

const parseId = (raw: unknown): number | null => {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const authFrom = identityFrom;

export const getAllLocationMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const locations = await getAllLocationMasterService(status || "Active");
    res.json({ success: true, count: locations.length, data: locations });
  } catch (error: any) {
    console.error("GetAllLocationMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getLocationMasterById = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, message: "A valid Location ID is required" });
    return;
  }
  try {
    const location = await getLocationMasterByIdService(id);
    if (!location) {
      res.status(404).json({ success: false, message: "Location not found" });
      return;
    }
    res.json({ success: true, data: location });
  } catch (error: any) {
    console.error("GetLocationMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveLocationMaster = async (req: Request, res: Response): Promise<void> => {
  const locationData: LocationMasterData = req.body;
  if (!locationData.LOCATION_NAME) {
    res.status(400).json({ success: false, message: "Location Name is required" });
    return;
  }
  try {
    const result = await saveLocationMasterService(locationData);
    res.json({ success: true, message: result.message || "Location saved successfully", LOCATION_ID: result.LOCATION_ID });
  } catch (error: any) {
    console.error("SaveLocationMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateLocationMaster = async (req: Request, res: Response): Promise<void> => {
  const locationData: LocationMasterData = req.body;
  const id = parseId(req.params.id) ?? parseId(String(locationData.LOCATION_ID ?? ""));
  if (!id) {
    res.status(400).json({ success: false, message: "A valid Location ID is required" });
    return;
  }
  try {
    locationData.LOCATION_ID = id;
    const result = await updateLocationMasterService(locationData);
    res.json({ success: true, message: result.message || "Location updated successfully" });
  } catch (error: any) {
    console.error("UpdateLocationMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteLocationMaster = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, message: "A valid Location ID is required" });
    return;
  }
  try {
    const { USER, ROLE, MAC_ADDRESS } = authFrom(req);
    const result = await deleteLocationMasterService(id, USER, ROLE, MAC_ADDRESS);
    res.json({ success: true, message: result.message || "Location deleted successfully" });
  } catch (error: any) {
    console.error("DeleteLocationMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
