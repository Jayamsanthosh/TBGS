import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllStoreProductMinimumStockService,
  getStoreProductMinimumStockByIdService,
  saveStoreProductMinimumStockService,
  updateStoreProductMinimumStockService,
  deleteStoreProductMinimumStockService,
  type StoreProductMinimumStockData,
} from "../services/storeProductMinimumStock.services";

export const getAllStoreProductMinimumStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const items = await getAllStoreProductMinimumStockService(status || undefined);
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllStoreProductMinimumStock error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getStoreProductMinimumStockById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "SNO is required" });
    return;
  }

  try {
    const item = await getStoreProductMinimumStockByIdService(parseInt(id as string, 10));

    if (!item) {
      res.status(404).json({ success: false, message: "Store product minimum stock not found" });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetStoreProductMinimumStockById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

const VALID_STATUSES = ["AC", "IA"];

export const saveStoreProductMinimumStock = async (req: Request, res: Response): Promise<void> => {
  const data: StoreProductMinimumStockData = req.body;

  if (!data.COMPANY_ID) {
    res.status(400).json({ success: false, message: "Company is required" });
    return;
  }
  if (!data.STORE_ID) {
    res.status(400).json({ success: false, message: "Store is required" });
    return;
  }
  if (!data.PRODUCT_ID) {
    res.status(400).json({ success: false, message: "Product is required" });
    return;
  }

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    const result = await saveStoreProductMinimumStockService(data);
    res.json({ success: true, message: result.message || "Data saved successfully", SNO: result.SNO });
  } catch (error: any) {
    console.error("SaveStoreProductMinimumStock error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateStoreProductMinimumStock = async (req: Request, res: Response): Promise<void> => {
  const data: StoreProductMinimumStockData = req.body;
  const { id } = req.params;

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    if (!data.SNO && id) {
      data.SNO = parseInt(id as string, 10);
    }

    const result = await updateStoreProductMinimumStockService(data);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateStoreProductMinimumStock error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteStoreProductMinimumStock = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "SNO is required" });
    return;
  }

  try {
    const result = await deleteStoreProductMinimumStockService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteStoreProductMinimumStock error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
