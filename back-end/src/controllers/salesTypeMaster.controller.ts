import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllSalesTypeMasterService,
  getSalesTypeMasterByIdService,
  saveSalesTypeMasterService,
  updateSalesTypeMasterService,
  deleteSalesTypeMasterService,
  SalesTypeMasterData
} from "../services/salesTypeMaster.services";

export const getAllSalesTypeMaster = async (_req: Request, res: Response): Promise<void> => {
  try {
    const records = await getAllSalesTypeMasterService();
    res.json({ success: true, count: records.length, data: records });
  } catch (error: any) {
    console.error("GetAllSalesTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getSalesTypeMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "SALES_TYPE_ID is required" });
    return;
  }

  try {
    const record = await getSalesTypeMasterByIdService(parseInt(id as string, 10));

    if (!record) {
      res.status(404).json({ success: false, message: "Sales type not found" });
      return;
    }

    res.json({ success: true, data: record });
  } catch (error: any) {
    console.error("GetSalesTypeMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveSalesTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const data: SalesTypeMasterData = req.body;

  if (!data.SALES_TYPE_NAME) {
    res.status(400).json({ success: false, message: "Sales type name is required" });
    return;
  }

  try {
    const result = await saveSalesTypeMasterService(data);
    res.json({ success: true, message: result.message || "Data saved successfully", SALES_TYPE_ID: result.SALES_TYPE_ID });
  } catch (error: any) {
    console.error("SaveSalesTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateSalesTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const data: SalesTypeMasterData = req.body;
  const { id } = req.params;

  try {
    if (!data.SALES_TYPE_ID && id) {
      data.SALES_TYPE_ID = parseInt(id as string, 10);
    }

    const result = await updateSalesTypeMasterService(data);
    res.json({ success: true, message: result.message || "Record updated successfully", SALES_TYPE_ID: result.SALES_TYPE_ID });
  } catch (error: any) {
    console.error("UpdateSalesTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteSalesTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "SALES_TYPE_ID is required" });
    return;
  }

  try {
    const { USER: user, ROLE: role, MAC_ADDRESS: macAddress } = identityFrom(req);
    const result = await deleteSalesTypeMasterService(parseInt(id as string, 10), user, role, macAddress);
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteSalesTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
