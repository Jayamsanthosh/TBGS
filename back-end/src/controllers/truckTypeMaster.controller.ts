import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllTruckTypeMasterService,
  getTruckTypeMasterByIdService,
  saveTruckTypeMasterService,
  updateTruckTypeMasterService,
  deleteTruckTypeMasterService,
  TruckTypeMasterData
} from "../services/truckTypeMaster.services";

export const getAllTruckTypeMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
    const truckTypes = await getAllTruckTypeMasterService(status);
    res.json({ success: true, count: truckTypes.length, data: truckTypes });
  } catch (error: any) {
    console.error("GetAllTruckTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getTruckTypeMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Truck Type ID is required" });
    return;
  }

  try {
    const truckType = await getTruckTypeMasterByIdService(parseInt(id as string, 10));

    if (!truckType) {
      res.status(404).json({ success: false, message: "Truck type not found" });
      return;
    }

    res.json({ success: true, data: truckType });
  } catch (error: any) {
    console.error("GetTruckTypeMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveTruckTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const truckTypeData: TruckTypeMasterData = req.body;

  if (!truckTypeData.TRUCK_TYPE_NAME) {
    res.status(400).json({ success: false, message: "Truck Type Name is required" });
    return;
  }

  try {
    const result = await saveTruckTypeMasterService(truckTypeData);
    res.json({ success: true, message: result.message || "Data saved successfully", TRUCK_TYPE_ID: result.TRUCK_TYPE_ID });
  } catch (error: any) {
    console.error("SaveTruckTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateTruckTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const truckTypeData: TruckTypeMasterData = req.body;
  const { id } = req.params;

  try {
    if (!truckTypeData.TRUCK_TYPE_ID && id) {
      truckTypeData.TRUCK_TYPE_ID = parseInt(id as string, 10);
    }

    const result = await updateTruckTypeMasterService(truckTypeData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateTruckTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteTruckTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Truck Type ID is required" });
    return;
  }

  try {
    const result = await deleteTruckTypeMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteTruckTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
