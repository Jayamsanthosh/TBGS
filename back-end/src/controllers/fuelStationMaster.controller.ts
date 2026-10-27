import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllFuelStationMasterService,
  getFuelStationMasterByIdService,
  saveFuelStationMasterService,
  updateFuelStationMasterService,
  deleteFuelStationMasterService,
  FuelStationMasterData
} from "../services/fuelStationMaster.services";

export const getAllFuelStationMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
    const fuelStations = await getAllFuelStationMasterService(status);
    res.json({ success: true, count: fuelStations.length, data: fuelStations });
  } catch (error: any) {
    console.error("GetAllFuelStationMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getFuelStationMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Fuel Station ID is required" });
    return;
  }

  const rawLinkId = req.query.LINK_ID ?? req.query.link_id;
  const linkId = rawLinkId != null && rawLinkId !== "" ? Number(rawLinkId) : null;

  try {
    const fuelStation = await getFuelStationMasterByIdService(
      parseInt(id as string, 10),
      linkId != null && Number.isFinite(linkId) ? linkId : null
    );

    if (!fuelStation) {
      res.status(404).json({ success: false, message: "Fuel station not found" });
      return;
    }

    res.json({ success: true, data: fuelStation });
  } catch (error: any) {
    console.error("GetFuelStationMasterById error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveFuelStationMaster = async (req: Request, res: Response): Promise<void> => {
  const fuelStationData: FuelStationMasterData = req.body;

  if (!fuelStationData.FUEL_STATIONE_NAME) {
    res.status(400).json({ success: false, message: "Fuel Station Name is required" });
    return;
  }

  try {
    const { USER, MAC_ADDRESS } = identityFrom(req);
    fuelStationData.USER = USER || fuelStationData.USER || "Admin";
    fuelStationData.MAC_ADDRESS = MAC_ADDRESS || fuelStationData.MAC_ADDRESS || "WEB";
    const rawLinkId = (fuelStationData as any).LINK_ID ?? req.query.LINK_ID ?? req.query.link_id;
    const linkId = rawLinkId != null && rawLinkId !== "" ? Number(rawLinkId) : 96;
    (fuelStationData as any).LINK_ID = linkId != null && Number.isFinite(linkId) ? linkId : 96;
    const result = await saveFuelStationMasterService(fuelStationData);
    res.json({ success: true, message: result.message || "Data saved successfully", FUEL_STATIONE_ID: result.FUEL_STATIONE_ID });
  } catch (error: any) {
    console.error("SaveFuelStationMaster error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateFuelStationMaster = async (req: Request, res: Response): Promise<void> => {
  const fuelStationData: FuelStationMasterData = req.body;
  const { id } = req.params;

  try {
    if (!fuelStationData.FUEL_STATIONE_ID && id) {
      fuelStationData.FUEL_STATIONE_ID = parseInt(id as string, 10);
    }
    const { USER, MAC_ADDRESS } = identityFrom(req);
    fuelStationData.USER = USER || fuelStationData.USER || "Admin";
    fuelStationData.MAC_ADDRESS = MAC_ADDRESS || fuelStationData.MAC_ADDRESS || "WEB";
    const rawLinkId = (fuelStationData as any).LINK_ID ?? req.query.LINK_ID ?? req.query.link_id;
    const linkId = rawLinkId != null && rawLinkId !== "" ? Number(rawLinkId) : 96;
    (fuelStationData as any).LINK_ID = linkId != null && Number.isFinite(linkId) ? linkId : 96;

    const result = await updateFuelStationMasterService(fuelStationData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateFuelStationMaster error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteFuelStationMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Fuel Station ID is required" });
    return;
  }

  try {
    const result = await deleteFuelStationMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteFuelStationMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
