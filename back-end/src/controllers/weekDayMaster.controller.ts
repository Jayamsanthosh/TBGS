import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllWeekDayMasterService,
  getWeekDayMasterByIdService,
  saveWeekDayMasterService,
  updateWeekDayMasterService,
  deleteWeekDayMasterService,
  WeekDayMasterData,
} from "../services/weekDayMaster.services";

export const getAllWeekDayMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const weekDays = await getAllWeekDayMasterService(status || undefined);
    res.json({ success: true, count: weekDays.length, data: weekDays });
  } catch (error: any) {
    console.error("GetAllWeekDayMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getWeekDayMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Week Day ID is required" });
    return;
  }

  try {
    const weekDay = await getWeekDayMasterByIdService(parseInt(id as string, 10));

    if (!weekDay) {
      res.status(404).json({ success: false, message: "Week day not found" });
      return;
    }

    res.json({ success: true, data: weekDay });
  } catch (error: any) {
    console.error("GetWeekDayMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

const VALID_STATUSES = ["AC", "IA"];

export const saveWeekDayMaster = async (req: Request, res: Response): Promise<void> => {
  const data: WeekDayMasterData = req.body;

  if (!data.WEEK_DAY_NAME?.trim()) {
    res.status(400).json({ success: false, message: "Week day name is required" });
    return;
  }

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    const result = await saveWeekDayMasterService(data);
    res.json({
      success: true,
      message: result.message || "Data saved successfully",
      WEEK_DAY_ID: result.WEEK_DAY_ID,
    });
  } catch (error: any) {
    console.error("SaveWeekDayMaster error:", error);
    res.status(400).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateWeekDayMaster = async (req: Request, res: Response): Promise<void> => {
  const data: WeekDayMasterData = req.body;
  const { id } = req.params;

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    if (!data.WEEK_DAY_ID && id) {
      data.WEEK_DAY_ID = parseInt(id as string, 10);
    }

    const result = await updateWeekDayMasterService(data);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateWeekDayMaster error:", error);
    res.status(400).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteWeekDayMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Week Day ID is required" });
    return;
  }

  try {
    const result = await deleteWeekDayMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteWeekDayMaster error:", error);
    res.status(400).json({ success: false, message: error?.message || "Internal server error" });
  }
};
