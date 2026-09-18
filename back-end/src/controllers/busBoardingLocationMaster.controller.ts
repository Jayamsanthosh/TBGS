import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllBusBoardingLocationMasterService,
  getBusBoardingLocationMasterByIdService,
  saveBusBoardingLocationMasterService,
  updateBusBoardingLocationMasterService,
  deleteBusBoardingLocationMasterService,
  BusBoardingLocationMasterData
} from "../services/busBoardingLocationMaster.services";

export const getAllBusBoardingLocationMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const locations = await getAllBusBoardingLocationMasterService(status || undefined);
    res.json({ success: true, count: locations.length, data: locations });
  } catch (error: any) {
    console.error("GetAllBusBoardingLocationMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getBusBoardingLocationMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ success: false, message: "Bus Boarding Location ID is required" });
    return;
  }
  try {
    const location = await getBusBoardingLocationMasterByIdService(parseInt(id as string, 10));
    if (!location) {
      res.status(404).json({ success: false, message: "Bus boarding location not found" });
      return;
    }
    res.json({ success: true, data: location });
  } catch (error: any) {
    console.error("GetBusBoardingLocationMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveBusBoardingLocationMaster = async (req: Request, res: Response): Promise<void> => {
  const locationData: BusBoardingLocationMasterData = req.body;
  if (!locationData.BUS_BOARDING_LOCATION_NAME) {
    res.status(400).json({ success: false, message: "Bus Boarding Location Name is required" });
    return;
  }
  if (!locationData.BUS_CODE) {
    res.status(400).json({ success: false, message: "Bus Code is required" });
    return;
  }
  try {
    const result = await saveBusBoardingLocationMasterService(locationData);
    res.json({ success: true, message: result.message || "Bus boarding location saved successfully" });
  } catch (error: any) {
    console.error("SaveBusBoardingLocationMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateBusBoardingLocationMaster = async (req: Request, res: Response): Promise<void> => {
  const locationData: BusBoardingLocationMasterData = req.body;
  const { id } = req.params;
  try {
    if (!locationData.BUS_BOARDING_LOCATION_ID && id) {
      locationData.BUS_BOARDING_LOCATION_ID = parseInt(id as string, 10);
    }
    const result = await updateBusBoardingLocationMasterService(locationData);
    res.json({ success: true, message: result.message || "Bus boarding location updated successfully" });
  } catch (error: any) {
    console.error("UpdateBusBoardingLocationMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteBusBoardingLocationMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);
  if (!id) {
    res.status(400).json({ success: false, message: "Bus Boarding Location ID is required" });
    return;
  }
  try {
    const result = await deleteBusBoardingLocationMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Bus boarding location deleted successfully" });
  } catch (error: any) {
    console.error("DeleteBusBoardingLocationMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
