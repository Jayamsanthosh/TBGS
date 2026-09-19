import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllTripTemplatePriceMappingService,
  saveTripTemplatePriceMappingService,
  updateTripTemplatePriceMappingService,
  deleteTripTemplatePriceMappingService,
  TripTemplatePriceMappingData
} from "../services/tripTemplatePriceMapping.services";

export const getAllTripTemplatePriceMapping = async (req: Request, res: Response): Promise<void> => {
  try {
    const mappings = await getAllTripTemplatePriceMappingService();
    res.json({ success: true, count: mappings.length, data: mappings });
  } catch (error: any) {
    console.error("GetAllTripTemplatePriceMapping error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveTripTemplatePriceMapping = async (req: Request, res: Response): Promise<void> => {
  const mappingData: TripTemplatePriceMappingData = req.body;

  if (!mappingData.TRIP_TEMPLATE_ID || !mappingData.COMPANY_ID || !mappingData.TRUCK_TYPE_ID) {
    res.status(400).json({ success: false, message: "Trip Template, Company and Truck Type are required" });
    return;
  }

  try {
    const result = await saveTripTemplatePriceMappingService(mappingData);
    res.json({ success: true, message: result.message || "Data saved successfully", PRICE_ID: result.PRICE_ID });
  } catch (error: any) {
    console.error("SaveTripTemplatePriceMapping error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateTripTemplatePriceMapping = async (req: Request, res: Response): Promise<void> => {
  const mappingData: TripTemplatePriceMappingData = req.body;
  const { id } = req.params;

  try {
    if (!mappingData.PRICE_ID && id) {
      mappingData.PRICE_ID = parseInt(id as string, 10);
    }

    const result = await updateTripTemplatePriceMappingService(mappingData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateTripTemplatePriceMapping error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteTripTemplatePriceMapping = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Price ID is required" });
    return;
  }

  try {
    const result = await deleteTripTemplatePriceMappingService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteTripTemplatePriceMapping error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
