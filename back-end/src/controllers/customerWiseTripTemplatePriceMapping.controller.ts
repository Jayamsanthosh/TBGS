import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllCustomerWiseTripTemplatePriceMappingService,
  saveCustomerWiseTripTemplatePriceMappingService,
  updateCustomerWiseTripTemplatePriceMappingService,
  deleteCustomerWiseTripTemplatePriceMappingService,
  CustomerWiseTripTemplatePriceMappingData
} from "../services/customerWiseTripTemplatePriceMapping.services";

export const getAllCustomerWiseTripTemplatePriceMapping = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "AC";
    const mappings = await getAllCustomerWiseTripTemplatePriceMappingService(status);
    res.json({ success: true, count: mappings.length, data: mappings });
  } catch (error: any) {
    console.error("GetAllCustomerWiseTripTemplatePriceMapping error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveCustomerWiseTripTemplatePriceMapping = async (req: Request, res: Response): Promise<void> => {
  const mappingData: CustomerWiseTripTemplatePriceMappingData = req.body;

  if (!mappingData.COMPANY_ID || !mappingData.BP_ID || !mappingData.TRIP_TEMPLATE_ID || !mappingData.TRUCK_TYPE_ID) {
    res.status(400).json({ success: false, message: "Company, Business Partner, Trip Template and Truck Type are required" });
    return;
  }

  try {
    const result = await saveCustomerWiseTripTemplatePriceMappingService(mappingData);
    res.json({ success: true, message: result.message || "Data saved successfully", PRICE_CUSTOMER_ID: result.PRICE_CUSTOMER_ID });
  } catch (error: any) {
    console.error("SaveCustomerWiseTripTemplatePriceMapping error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateCustomerWiseTripTemplatePriceMapping = async (req: Request, res: Response): Promise<void> => {
  const mappingData: CustomerWiseTripTemplatePriceMappingData = req.body;
  const { id } = req.params;

  try {
    if (!mappingData.PRICE_CUSTOMER_ID && id) {
      mappingData.PRICE_CUSTOMER_ID = parseInt(id as string, 10);
    }

    const result = await updateCustomerWiseTripTemplatePriceMappingService(mappingData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateCustomerWiseTripTemplatePriceMapping error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteCustomerWiseTripTemplatePriceMapping = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Price Customer ID is required" });
    return;
  }

  try {
    const result = await deleteCustomerWiseTripTemplatePriceMappingService(
      parseInt(id as string, 10),
      (USER as string) || "Admin",
      (ROLE as string) || "Admin",
      (MAC_ADDRESS as string) || "WEB"
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteCustomerWiseTripTemplatePriceMapping error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
