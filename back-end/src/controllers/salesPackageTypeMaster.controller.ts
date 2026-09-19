import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllSalesPackageTypeMasterService,
  getSalesPackageTypeMasterByIdService,
  saveSalesPackageTypeMasterService,
  updateSalesPackageTypeMasterService,
  deleteSalesPackageTypeMasterService,
  SalesPackageTypeMasterData
} from "../services/salesPackageTypeMaster.services";

export const getAllSalesPackageTypeMaster = async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await getAllSalesPackageTypeMasterService();
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllSalesPackageTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getSalesPackageTypeMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Sales Package Type ID is required" });
    return;
  }

  try {
    const item = await getSalesPackageTypeMasterByIdService(parseInt(id as string, 10));

    if (!item) {
      res.status(404).json({ success: false, message: "Sales package type not found" });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetSalesPackageTypeMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveSalesPackageTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const data: SalesPackageTypeMasterData = req.body;

  if (!data.SALES_PACKAGE_TYPE_NAME) {
    res.status(400).json({ success: false, message: "Sales Package Type Name is required" });
    return;
  }

  try {
    const result = await saveSalesPackageTypeMasterService(data);
    res.json({ success: true, message: result.message || "Sales package type saved successfully" });
  } catch (error: any) {
    console.error("SaveSalesPackageTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateSalesPackageTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const data: SalesPackageTypeMasterData = req.body;
  const { id } = req.params;

  try {
    if (!data.SALES_PACKAGE_TYPE_ID && id) {
      data.SALES_PACKAGE_TYPE_ID = parseInt(id as string, 10);
    }

    const result = await updateSalesPackageTypeMasterService(data);
    res.json({ success: true, message: result.message || "Sales package type updated successfully" });
  } catch (error: any) {
    console.error("UpdateSalesPackageTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteSalesPackageTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Sales Package Type ID is required" });
    return;
  }

  try {
    const result = await deleteSalesPackageTypeMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Sales package type deleted successfully" });
  } catch (error: any) {
    console.error("DeleteSalesPackageTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
