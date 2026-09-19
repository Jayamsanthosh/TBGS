import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllFuelTypeMasterService,
  getFuelTypeMasterByIdService,
  getFuelTypeOptionsService,
  saveFuelTypeMasterService,
  updateFuelTypeMasterService,
  deleteFuelTypeMasterService,
  FuelTypeMasterData
} from "../services/fuelTypeMaster.services";

const VALID_STATUSES = ["AC", "IN"];

const parseId = (raw: unknown): number | null => {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const authFrom = identityFrom;

export const getAllFuelTypeMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const items = await getAllFuelTypeMasterService(status || undefined);
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllFuelTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getFuelTypeOptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "AC";
    const items = await getFuelTypeOptionsService(status);
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetFuelTypeOptions error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getFuelTypeMasterById = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, message: "A valid Fuel Type ID is required" });
    return;
  }
  try {
    const item = await getFuelTypeMasterByIdService(id);
    if (!item) {
      res.status(404).json({ success: false, message: "Fuel type not found" });
      return;
    }
    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetFuelTypeMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveFuelTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const fuelTypeData: FuelTypeMasterData = req.body;
  if (!fuelTypeData.FUEL_TYPE_NAME || !String(fuelTypeData.FUEL_TYPE_NAME).trim()) {
    res.status(400).json({ success: false, message: "Fuel Type Name is required" });
    return;
  }
  if (fuelTypeData.STATUS_MASTER && !VALID_STATUSES.includes(fuelTypeData.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IN" });
    return;
  }
  try {
    const result = await saveFuelTypeMasterService(fuelTypeData);
    res.json({
      success: true,
      message: result.message || "Fuel type saved successfully",
      FUEL_TYPE_ID: result.FUEL_TYPE_ID
    });
  } catch (error: any) {
    console.error("SaveFuelTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateFuelTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const fuelTypeData: FuelTypeMasterData = req.body;
  const id = parseId(req.params.id) ?? parseId(String(fuelTypeData.FUEL_TYPE_ID ?? ""));
  if (!id) {
    res.status(400).json({ success: false, message: "A valid Fuel Type ID is required" });
    return;
  }
  if (!fuelTypeData.FUEL_TYPE_NAME || !String(fuelTypeData.FUEL_TYPE_NAME).trim()) {
    res.status(400).json({ success: false, message: "Fuel Type Name is required" });
    return;
  }
  if (fuelTypeData.STATUS_MASTER && !VALID_STATUSES.includes(fuelTypeData.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IN" });
    return;
  }
  try {
    fuelTypeData.FUEL_TYPE_ID = id;
    const result = await updateFuelTypeMasterService(fuelTypeData);
    res.json({ success: true, message: result.message || "Fuel type updated successfully" });
  } catch (error: any) {
    console.error("UpdateFuelTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteFuelTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, message: "A valid Fuel Type ID is required" });
    return;
  }
  const { USER, ROLE, MAC_ADDRESS } = authFrom(req);
  if ((ROLE || "").toLowerCase() !== "admin") {
    res.status(403).json({ success: false, message: "NO RIGHTS TO DELETE" });
    return;
  }
  try {
    const result = await deleteFuelTypeMasterService(id, USER, ROLE, MAC_ADDRESS);
    res.json({ success: true, message: result.message || "Fuel type deleted successfully" });
  } catch (error: any) {
    console.error("DeleteFuelTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
