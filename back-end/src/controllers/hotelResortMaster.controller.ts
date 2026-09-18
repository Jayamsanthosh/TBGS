import { Request, Response } from "express";
import {
  getAllHotelResortMasterService,
  getHotelResortMasterByIdService,
  saveHotelResortMasterService,
  updateHotelResortMasterService,
  deleteHotelResortMasterService,
  HotelResortMasterData
} from "../services/hotelResortMaster.services";

export const getAllHotelResortMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || 'AC';
    const records = await getAllHotelResortMasterService(status);
    res.json({ success: true, count: records.length, data: records });
  } catch (error: any) {
    console.error("GetAllHotelResortMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getHotelResortMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "HOTEL_ID is required" });
    return;
  }

  try {
    const record = await getHotelResortMasterByIdService(parseInt(id as string, 10));
    if (!record) {
      res.status(404).json({ success: false, message: "Hotel not found" });
      return;
    }
    res.json({ success: true, data: record });
  } catch (error: any) {
    console.error("GetHotelResortMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveHotelResortMaster = async (req: Request, res: Response): Promise<void> => {
  const data: HotelResortMasterData = req.body;

  if (!data.HOTEL_NAME) {
    res.status(400).json({ success: false, message: "Hotel name is required" });
    return;
  }

  if (data.HOTEL_NAME.length > 10) {
    res.status(400).json({ success: false, message: "Hotel name must be 10 characters or less" });
    return;
  }

  try {
    const result = await saveHotelResortMasterService(data);
    res.json({ success: true, message: result.message || "Data saved successfully", HOTEL_ID: result.HOTEL_ID });
  } catch (error: any) {
    console.error("SaveHotelResortMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateHotelResortMaster = async (req: Request, res: Response): Promise<void> => {
  const data: HotelResortMasterData = req.body;
  const { id } = req.params;

  try {
    if (!data.HOTEL_ID && id) {
      data.HOTEL_ID = parseInt(id as string, 10);
    }
    const result = await updateHotelResortMasterService(data);
    res.json({ success: true, message: result.message || "Record updated successfully", HOTEL_ID: result.HOTEL_ID });
  } catch (error: any) {
    console.error("UpdateHotelResortMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteHotelResortMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "HOTEL_ID is required" });
    return;
  }

  try {
    const result = await deleteHotelResortMasterService(parseInt(id as string, 10));
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteHotelResortMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
