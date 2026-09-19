import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllTruckMasterHdrService,
  getTruckMasterHdrByIdService,
  saveTruckMasterHdrService,
  updateTruckMasterHdrService,
  deleteTruckMasterHdrService,
  TruckMasterHdrData
} from "../services/truckMasterHdr.services";

const VALID_STATUSES = ["AC", "IN"];

const parseId = (raw: unknown): number | null => {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const authFrom = identityFrom;

export const getAllTruckMasterHdr = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const items = await getAllTruckMasterHdrService(status || undefined);
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllTruckMasterHdr error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getTruckMasterHdrById = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, message: "A valid Truck ID is required" });
    return;
  }
  try {
    const truck = await getTruckMasterHdrByIdService(id);
    if (!truck) {
      res.status(404).json({ success: false, message: "Truck not found" });
      return;
    }
    res.json({ success: true, data: truck });
  } catch (error: any) {
    console.error("GetTruckMasterHdrById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveTruckMasterHdr = async (req: Request, res: Response): Promise<void> => {
  const truckData: TruckMasterHdrData = req.body;
  if (!truckData.TRUCK_NO || !String(truckData.TRUCK_NO).trim()) {
    res.status(400).json({ success: false, message: "Truck No is required" });
    return;
  }
  if (truckData.STATUS_MASTER && !VALID_STATUSES.includes(truckData.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IN" });
    return;
  }
  try {
    const result = await saveTruckMasterHdrService(truckData);
    res.json({ success: true, message: result.message || "Truck saved successfully", TRUCK_ID: result.TRUCK_ID });
  } catch (error: any) {
    console.error("SaveTruckMasterHdr error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateTruckMasterHdr = async (req: Request, res: Response): Promise<void> => {
  const truckData: TruckMasterHdrData = req.body;
  const id = parseId(req.params.id) ?? parseId(String(truckData.TRUCK_ID ?? ""));
  if (!id) {
    res.status(400).json({ success: false, message: "A valid Truck ID is required" });
    return;
  }
  if (!truckData.TRUCK_NO || !String(truckData.TRUCK_NO).trim()) {
    res.status(400).json({ success: false, message: "Truck No is required" });
    return;
  }
  if (truckData.STATUS_MASTER && !VALID_STATUSES.includes(truckData.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IN" });
    return;
  }
  try {
    truckData.TRUCK_ID = id;
    const result = await updateTruckMasterHdrService(truckData);
    res.json({ success: true, message: result.message || "Truck updated successfully" });
  } catch (error: any) {
    console.error("UpdateTruckMasterHdr error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteTruckMasterHdr = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, message: "A valid Truck ID is required" });
    return;
  }
  const { USER, ROLE, MAC_ADDRESS } = authFrom(req);
  const roleLower = (ROLE || "").toLowerCase();
  const allowedRoles = ["admin", "super admin", "administrator"];
  if (ROLE && !allowedRoles.includes(roleLower)) {
    res.status(403).json({ success: false, message: "NO RIGHTS TO DELETE" });
    return;
  }
  try {
    const result = await deleteTruckMasterHdrService(id, USER, ROLE, MAC_ADDRESS);
    res.json({ success: true, message: result.message || "Truck deleted successfully" });
  } catch (error: any) {
    console.error("DeleteTruckMasterHdr error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
