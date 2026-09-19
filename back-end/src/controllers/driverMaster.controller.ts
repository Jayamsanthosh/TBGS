import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllDriverMasterService,
  getDriverMasterByIdService,
  getDriverOptionsService,
  saveDriverMasterService,
  updateDriverMasterService,
  deleteDriverMasterService,
  DriverMasterData
} from "../services/driverMaster.services";

const VALID_STATUSES = ["AC", "IN"];

const parseId = (raw: unknown): number | null => {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const authFrom = identityFrom;

const validateDriver = (data: DriverMasterData): string | null => {
  if (!data.DRIVER_EMP_ID || Number.isNaN(Number(data.DRIVER_EMP_ID))) {
    return "Driver Employee ID is required";
  }
  if (!data.DRIVER_FULL_NAME || !String(data.DRIVER_FULL_NAME).trim()) {
    return "Driver Full Name is required";
  }
  if (!data.COMPANY_ID || Number.isNaN(Number(data.COMPANY_ID))) {
    return "Company is required";
  }
  if (!data.DEPARTMENT_ID || Number.isNaN(Number(data.DEPARTMENT_ID))) {
    return "Department is required";
  }
  if (!data.DESIGNATION_ID || Number.isNaN(Number(data.DESIGNATION_ID))) {
    return "Designation is required";
  }
  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    return "Status must be AC or IN";
  }
  return null;
};

export const getAllDriverMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const items = await getAllDriverMasterService(status || undefined);
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllDriverMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getDriverOptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "AC";
    const items = await getDriverOptionsService(status);
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetDriverOptions error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getDriverMasterById = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, message: "A valid SNO is required" });
    return;
  }
  try {
    const item = await getDriverMasterByIdService(id);
    if (!item) {
      res.status(404).json({ success: false, message: "Driver not found" });
      return;
    }
    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetDriverMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveDriverMaster = async (req: Request, res: Response): Promise<void> => {
  const driverData: DriverMasterData = req.body;
  const validationError = validateDriver(driverData);
  if (validationError) {
    res.status(400).json({ success: false, message: validationError });
    return;
  }
  try {
    const result = await saveDriverMasterService(driverData);
    res.json({
      success: true,
      message: result.message || "Driver saved successfully",
      SNO: result.SNO
    });
  } catch (error: any) {
    console.error("SaveDriverMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateDriverMaster = async (req: Request, res: Response): Promise<void> => {
  const driverData: DriverMasterData = req.body;
  const id = parseId(req.params.id) ?? parseId(String(driverData.SNO ?? ""));
  if (!id) {
    res.status(400).json({ success: false, message: "A valid SNO is required" });
    return;
  }
  const validationError = validateDriver(driverData);
  if (validationError) {
    res.status(400).json({ success: false, message: validationError });
    return;
  }
  try {
    driverData.SNO = id;
    const result = await updateDriverMasterService(driverData);
    res.json({ success: true, message: result.message || "Driver updated successfully" });
  } catch (error: any) {
    console.error("UpdateDriverMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteDriverMaster = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, message: "A valid SNO is required" });
    return;
  }
  const { USER, ROLE, MAC_ADDRESS } = authFrom(req);
  if ((ROLE || "").toLowerCase() !== "admin") {
    res.status(403).json({ success: false, message: "NO RIGHTS TO DELETE" });
    return;
  }
  try {
    const result = await deleteDriverMasterService(id, USER, ROLE, MAC_ADDRESS);
    res.json({ success: true, message: result.message || "Driver deleted successfully" });
  } catch (error: any) {
    console.error("DeleteDriverMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
