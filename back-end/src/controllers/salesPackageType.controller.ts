import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllSalesPackageTypeService,
  getSalesPackageTypeByIdService,
  saveSalesPackageTypeService,
  updateSalesPackageTypeService,
  deleteSalesPackageTypeService,
  SalesPackageTypeData
} from "../services/salesPackageType.services";

export const getAllSalesPackageType = async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await getAllSalesPackageTypeService();
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllSalesPackageType error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getSalesPackageTypeById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ success: false, message: "Sales Package Type ID is required" });
    return;
  }
  try {
    const item = await getSalesPackageTypeByIdService(parseInt(id as string, 10));
    if (!item) {
      res.status(404).json({ success: false, message: "Sales package type not found" });
      return;
    }
    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetSalesPackageTypeById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveSalesPackageType = async (req: Request, res: Response): Promise<void> => {
  const data: SalesPackageTypeData = req.body;
  if (!data.SALES_PACKAGE_TYPE_NAME) {
    res.status(400).json({ success: false, message: "Sales Package Type Name is required" });
    return;
  }
  try {
    const result = await saveSalesPackageTypeService(data);
    res.json({ success: true, message: result.message || "Sales package type saved successfully" });
  } catch (error: any) {
    console.error("SaveSalesPackageType error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateSalesPackageType = async (req: Request, res: Response): Promise<void> => {
  const data: SalesPackageTypeData = req.body;
  const { id } = req.params;
  try {
    if (!data.SALES_PACKAGE_TYPE_ID && id) {
      data.SALES_PACKAGE_TYPE_ID = parseInt(id as string, 10);
    }
    const result = await updateSalesPackageTypeService(data);
    res.json({ success: true, message: result.message || "Sales package type updated successfully" });
  } catch (error: any) {
    console.error("UpdateSalesPackageType error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteSalesPackageType = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);
  if (!id) {
    res.status(400).json({ success: false, message: "Sales Package Type ID is required" });
    return;
  }
  try {
    const result = await deleteSalesPackageTypeService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Sales package type deleted successfully" });
  } catch (error: any) {
    console.error("DeleteSalesPackageType error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
