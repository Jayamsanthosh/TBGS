import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllHotelResortMasterService,
  getHotelResortMasterByIdService,
  saveHotelResortMasterService,
  updateHotelResortMasterService,
  deleteHotelResortMasterService,
  HotelResortMasterData
} from "../services/hotelResortMaster.services";

const DELETE_ROLES = new Set(["admin", "super admin", "administrator"]);

const linkIdFromQuery = (query: Request["query"]): number | null => {
  const raw = (query.link_id as string) || (query.linkId as string) || "0";
  const linkId = parseInt(raw, 10);
  return Number.isFinite(linkId) && linkId > 0 ? linkId : null;
};

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
    const linkId = linkIdFromQuery(req.query);
    const record = await getHotelResortMasterByIdService(parseInt(id as string, 10), linkId);
    if (!record) {
      res.status(404).json({ success: false, message: "Hotel not found" });
      return;
    }
    res.json({ success: true, data: record });
  } catch (error: any) {
    console.error("GetHotelResortMasterById error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
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

  if (data.LINK_ID === undefined || data.LINK_ID === null) {
    const linkId = linkIdFromQuery(req.query);
    if (linkId) data.LINK_ID = linkId;
  }

  try {
    const result = await saveHotelResortMasterService(data);
    res.json({ success: true, message: result.message || "Data saved successfully", HOTEL_ID: result.HOTEL_ID });
  } catch (error: any) {
    console.error("SaveHotelResortMaster error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateHotelResortMaster = async (req: Request, res: Response): Promise<void> => {
  const data: HotelResortMasterData = req.body;
  const { id } = req.params;

  if (data.LINK_ID === undefined || data.LINK_ID === null) {
    const linkId = linkIdFromQuery(req.query);
    if (linkId) data.LINK_ID = linkId;
  }

  try {
    if (!data.HOTEL_ID && id) {
      data.HOTEL_ID = parseInt(id as string, 10);
    }
    const result = await updateHotelResortMasterService(data);
    res.json({ success: true, message: result.message || "Record updated successfully", HOTEL_ID: result.HOTEL_ID });
  } catch (error: any) {
    console.error("UpdateHotelResortMaster error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteHotelResortMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { ROLE } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "HOTEL_ID is required" });
    return;
  }

  if (!DELETE_ROLES.has(String(ROLE).trim().toLowerCase())) {
    res.status(403).json({ success: false, message: "Only administrators can delete hotels" });
    return;
  }

  try {
    const result = await deleteHotelResortMasterService(parseInt(id as string, 10));
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteHotelResortMaster error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
