import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllProductCompanyMainCategoryMappingService,
  getProductCompanyMainCategoryMappingByIdService,
  saveProductCompanyMainCategoryMappingService,
  updateProductCompanyMainCategoryMappingService,
  deleteProductCompanyMainCategoryMappingService,
  ProductCompanyMainCategoryMappingData
} from "../services/productCompanyMainCategoryMapping.services";

export const getAllProductCompanyMainCategoryMapping = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req.query.companyId as string) || "";
    const mainCategoryId = (req.query.mainCategoryId as string) || "";
    const records = await getAllProductCompanyMainCategoryMappingService(companyId, mainCategoryId);
    res.json({ success: true, count: records.length, data: records });
  } catch (error: any) {
    console.error("GetAllProductCompanyMainCategoryMapping error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getProductCompanyMainCategoryMappingById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "SNO is required" });
    return;
  }

  try {
    const record = await getProductCompanyMainCategoryMappingByIdService(parseInt(id as string, 10));

    if (!record) {
      res.status(404).json({ success: false, message: "Mapping not found" });
      return;
    }

    res.json({ success: true, data: record });
  } catch (error: any) {
    console.error("GetProductCompanyMainCategoryMappingById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveProductCompanyMainCategoryMapping = async (req: Request, res: Response): Promise<void> => {
  const data: ProductCompanyMainCategoryMappingData = req.body;

  if (!data.COMPANY_ID) {
    res.status(400).json({ success: false, message: "Company is required" });
    return;
  }
  if (!data.MAIN_CATEGORY_ID) {
    res.status(400).json({ success: false, message: "Main category is required" });
    return;
  }

  try {
    const result = await saveProductCompanyMainCategoryMappingService(data);
    res.json({ success: true, message: result.message || "Data saved successfully", SNO: result.SNO });
  } catch (error: any) {
    console.error("SaveProductCompanyMainCategoryMapping error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateProductCompanyMainCategoryMapping = async (req: Request, res: Response): Promise<void> => {
  const data: ProductCompanyMainCategoryMappingData = req.body;
  const { id } = req.params;

  try {
    if (!data.SNO && id) {
      data.SNO = parseInt(id as string, 10);
    }

    const result = await updateProductCompanyMainCategoryMappingService(data);
    res.json({ success: true, message: result.message || "Record updated successfully", SNO: result.SNO });
  } catch (error: any) {
    console.error("UpdateProductCompanyMainCategoryMapping error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteProductCompanyMainCategoryMapping = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "SNO is required" });
    return;
  }

  try {
    const { USER: user, ROLE: role, MAC_ADDRESS: macAddress } = identityFrom(req);
    const result = await deleteProductCompanyMainCategoryMappingService(parseInt(id as string, 10), user, role, macAddress);
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteProductCompanyMainCategoryMapping error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
