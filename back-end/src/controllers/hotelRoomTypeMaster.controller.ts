import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  getAllHotelRoomTypeMasterService,
  getHotelRoomTypeMasterByIdService,
  saveHotelRoomTypeMasterService,
  updateHotelRoomTypeMasterService,
  deleteHotelRoomTypeMasterService,
  type HotelRoomTypeMasterData,
} from "../services/hotelRoomTypeMaster.services";

export const getAllHotelRoomTypeMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const items = await getAllHotelRoomTypeMasterService(status || undefined);
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllHotelRoomTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getHotelRoomTypeMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "ROOM_TYPE_ID is required" });
    return;
  }

  try {
    const item = await getHotelRoomTypeMasterByIdService(parseInt(id as string, 10));

    if (!item) {
      res.status(404).json({ success: false, message: "Hotel room type not found" });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetHotelRoomTypeMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

const VALID_STATUSES = ["AC", "IN"];

export const saveHotelRoomTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const data: HotelRoomTypeMasterData = req.body;

  if (!data.ROOM_TYPE_NAME?.trim()) {
    res.status(400).json({ success: false, message: "Room type name is required" });
    return;
  }

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IN" });
    return;
  }

  try {
    const result = await saveHotelRoomTypeMasterService(data);
    res.json({ success: true, message: result.message || "Data saved successfully", ROOM_TYPE_ID: result.ROOM_TYPE_ID });
  } catch (error: any) {
    console.error("SaveHotelRoomTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateHotelRoomTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const data: HotelRoomTypeMasterData = req.body;
  const { id } = req.params;

  if (!data.ROOM_TYPE_NAME?.trim()) {
    res.status(400).json({ success: false, message: "Room type name is required" });
    return;
  }

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IN" });
    return;
  }

  try {
    if (!data.ROOM_TYPE_ID && id) {
      data.ROOM_TYPE_ID = parseInt(id as string, 10);
    }

    const result = await updateHotelRoomTypeMasterService(data);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateHotelRoomTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteHotelRoomTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "ROOM_TYPE_ID is required" });
    return;
  }

  try {
    const result = await deleteHotelRoomTypeMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteHotelRoomTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};