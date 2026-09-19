import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllAirportMasterService,
  getAirportMasterByIdService,
  saveAirportMasterService,
  updateAirportMasterService,
  deleteAirportMasterService,
  type AirportMasterData,
} from "../services/airportMaster.services";

export const getAllAirportMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const items = await getAllAirportMasterService(status || undefined);
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllAirportMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getAirportMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "AIRPORT_ID is required" });
    return;
  }

  try {
    const item = await getAirportMasterByIdService(parseInt(id as string, 10));

    if (!item) {
      res.status(404).json({ success: false, message: "Airport not found" });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetAirportMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

const VALID_STATUSES = ["AC", "IA"];

export const saveAirportMaster = async (req: Request, res: Response): Promise<void> => {
  const data: AirportMasterData = req.body;

  if (!data.AIRPORT_NAME?.trim()) {
    res.status(400).json({ success: false, message: "Airport name is required" });
    return;
  }
  if (!data.COUNTRY_ID) {
    res.status(400).json({ success: false, message: "Country is required" });
    return;
  }

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    const result = await saveAirportMasterService(data);
    res.json({ success: true, message: result.message || "Data saved successfully", AIRPORT_ID: result.AIRPORT_ID });
  } catch (error: any) {
    console.error("SaveAirportMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateAirportMaster = async (req: Request, res: Response): Promise<void> => {
  const data: AirportMasterData = req.body;
  const { id } = req.params;

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    if (!data.AIRPORT_ID && id) {
      data.AIRPORT_ID = parseInt(id as string, 10);
    }

    const result = await updateAirportMasterService(data);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateAirportMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteAirportMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "AIRPORT_ID is required" });
    return;
  }

  try {
    const result = await deleteAirportMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteAirportMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
