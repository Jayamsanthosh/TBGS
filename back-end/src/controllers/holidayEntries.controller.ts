import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllHolidayEntriesService,
  getHolidayEntriesByIdService,
  saveHolidayEntriesService,
  updateHolidayEntriesService,
  deleteHolidayEntriesService,
  submitHolidayEntriesService,
  HolidayEntriesData
} from "../services/holidayEntries.services";

export const getAllHolidayEntries = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
    const fromDate = (req.query.fromDate as string) || "";
    const toDate = (req.query.toDate as string) || "";
    const holidays = await getAllHolidayEntriesService(status, fromDate || undefined, toDate || undefined);
    res.json({ success: true, count: holidays.length, data: holidays });
  } catch (error: any) {
    console.error("GetAllHolidayEntries error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getHolidayEntriesById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ success: false, message: "Holiday ID is required" });
    return;
  }
  try {
    const holiday = await getHolidayEntriesByIdService(parseInt(id as string, 10));
    if (!holiday) {
      res.status(404).json({ success: false, message: "Holiday entry not found" });
      return;
    }
    res.json({ success: true, data: holiday });
  } catch (error: any) {
    console.error("GetHolidayEntriesById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveHolidayEntries = async (req: Request, res: Response): Promise<void> => {
  const holidayData: HolidayEntriesData = req.body;
  if (!holidayData.HOLIDAY_DATE || !holidayData.HOLIDAY_REASON) {
    res.status(400).json({ success: false, message: "Holiday Date and Reason are required" });
    return;
  }
  try {
    const result = await saveHolidayEntriesService(holidayData);
    res.json({ success: true, message: result.message || "Holiday entry saved successfully" });
  } catch (error: any) {
    console.error("SaveHolidayEntries error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateHolidayEntries = async (req: Request, res: Response): Promise<void> => {
  const holidayData: HolidayEntriesData = req.body;
  const { id } = req.params;
  try {
    if (!holidayData.HOLIDAY_ID && id) {
      holidayData.HOLIDAY_ID = parseInt(id as string, 10);
    }
    const result = await updateHolidayEntriesService(holidayData);
    res.json({ success: true, message: result.message || "Holiday entry updated successfully" });
  } catch (error: any) {
    console.error("UpdateHolidayEntries error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const submitHolidayEntries = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { ROLE } = identityFrom(req);
  if (!id) {
    res.status(400).json({ success: false, message: "Holiday ID is required" });
    return;
  }
  try {
    const result = await submitHolidayEntriesService(parseInt(id as string, 10), ROLE as string);
    res.json({ success: true, message: result.message || "Holiday entry submitted successfully" });
  } catch (error: any) {
    console.error("SubmitHolidayEntries error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteHolidayEntries = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);
  if (!id) {
    res.status(400).json({ success: false, message: "Holiday ID is required" });
    return;
  }
  try {
    const result = await deleteHolidayEntriesService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Holiday entry deleted successfully" });
  } catch (error: any) {
    console.error("DeleteHolidayEntries error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
