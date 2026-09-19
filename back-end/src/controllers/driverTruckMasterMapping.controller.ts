import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllMappingService,
  getMappingByIdService,
  saveMappingService,
  updateMappingService,
  deleteMappingService,
  getDriverOptionsService,
  getTruckOptionsService,
  type DriverTruckMasterMappingData,
} from "../services/driverTruckMasterMapping.services";

const VALID_STATUSES = ["AC", "IN"];

export const getAllMapping = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const items = await getAllMappingService(status || undefined);
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllMapping error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getMappingById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "SNO is required" });
    return;
  }

  try {
    const item = await getMappingByIdService(parseInt(id as string, 10));

    if (!item) {
      res.status(404).json({ success: false, message: "Mapping not found" });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetMappingById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getDriverOptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "AC";
    const drivers = await getDriverOptionsService(status);
    res.json({ success: true, count: drivers.length, data: drivers });
  } catch (error: any) {
    console.error("GetDriverOptions error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getTruckOptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "AC";
    const trucks = await getTruckOptionsService(status);
    res.json({ success: true, count: trucks.length, data: trucks });
  } catch (error: any) {
    console.error("GetTruckOptions error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveMapping = async (req: Request, res: Response): Promise<void> => {
  const data: DriverTruckMasterMappingData = req.body;

  if (!data.DRIVER_EMP_ID) {
    res.status(400).json({ success: false, message: "Driver is required" });
    return;
  }

  if (!data.TRUCK_ID) {
    res.status(400).json({ success: false, message: "Truck is required" });
    return;
  }

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IN" });
    return;
  }

  try {
    const result = await saveMappingService(data);
    res.json({ success: true, message: result.message || "Data saved successfully", SNO: result.SNO });
  } catch (error: any) {
    console.error("SaveMapping error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateMapping = async (req: Request, res: Response): Promise<void> => {
  const data: DriverTruckMasterMappingData = req.body;
  const { id } = req.params;

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IN" });
    return;
  }

  try {
    if (!data.SNO && id) {
      data.SNO = parseInt(id as string, 10);
    }

    const result = await updateMappingService(data);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateMapping error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteMapping = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "SNO is required" });
    return;
  }

  const roleLower = ((ROLE as string) || "").toLowerCase();
  const allowedRoles = ["admin", "super admin", "administrator"];
  if (ROLE && !allowedRoles.includes(roleLower)) {
    res.status(403).json({ success: false, message: "NO RIGHTS TO DELETE" });
    return;
  }

  try {
    const result = await deleteMappingService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteMapping error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
