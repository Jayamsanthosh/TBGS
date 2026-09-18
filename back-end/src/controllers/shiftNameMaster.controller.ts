import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllShiftNameMasterService,
  getShiftNameMasterByIdService,
  saveShiftNameMasterService,
  updateShiftNameMasterService,
  deleteShiftNameMasterService,
  ShiftNameMasterData,
} from "../services/shiftNameMaster.services";

export const getAllShiftNameMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const shifts = await getAllShiftNameMasterService(status || undefined);
    res.json({ success: true, count: shifts.length, data: shifts });
  } catch (error: any) {
    console.error("GetAllShiftNameMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getShiftNameMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Shift Name ID is required" });
    return;
  }

  try {
    const shift = await getShiftNameMasterByIdService(parseInt(id as string, 10));

    if (!shift) {
      res.status(404).json({ success: false, message: "Shift name not found" });
      return;
    }

    res.json({ success: true, data: shift });
  } catch (error: any) {
    console.error("GetShiftNameMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

const VALID_STATUSES = ["AC", "IA"];

export const saveShiftNameMaster = async (req: Request, res: Response): Promise<void> => {
  const data: ShiftNameMasterData = req.body;

  if (!data.SHIFT_NAME?.trim()) {
    res.status(400).json({ success: false, message: "Shift name is required" });
    return;
  }

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    const result = await saveShiftNameMasterService(data);
    res.json({
      success: true,
      message: result.message || "Data saved successfully",
      SHIFT_NAME_ID: result.SHIFT_NAME_ID,
    });
  } catch (error: any) {
    console.error("SaveShiftNameMaster error:", error);
    res.status(400).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateShiftNameMaster = async (req: Request, res: Response): Promise<void> => {
  const data: ShiftNameMasterData = req.body;
  const { id } = req.params;

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    if (!data.SHIFT_NAME_ID && id) {
      data.SHIFT_NAME_ID = parseInt(id as string, 10);
    }

    const result = await updateShiftNameMasterService(data);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateShiftNameMaster error:", error);
    res.status(400).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteShiftNameMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Shift Name ID is required" });
    return;
  }

  try {
    const result = await deleteShiftNameMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteShiftNameMaster error:", error);
    res.status(400).json({ success: false, message: error?.message || "Internal server error" });
  }
};
