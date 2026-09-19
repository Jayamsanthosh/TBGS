import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllStoreMasterService,
  getStoreMasterByIdService,
  saveStoreMasterService,
  updateStoreMasterService,
  deleteStoreMasterService,
  StoreMasterData
} from "../services/storeMaster.services";

export const getAllStoreMaster = async (_req: Request, res: Response): Promise<void> => {
  try {
    const stores = await getAllStoreMasterService();
    res.json({ success: true, count: stores.length, data: stores });
  } catch (error: any) {
    console.error("GetAllStoreMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getStoreMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Store ID is required" });
    return;
  }

  try {
    const store = await getStoreMasterByIdService(parseInt(id as string, 10));

    if (!store) {
      res.status(404).json({ success: false, message: "Store not found" });
      return;
    }

    res.json({ success: true, data: store });
  } catch (error: any) {
    console.error("GetStoreMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveStoreMaster = async (req: Request, res: Response): Promise<void> => {
  const storeData: StoreMasterData = req.body;

  if (!storeData.STORE_NAME) {
    res.status(400).json({ success: false, message: "Store Name is required" });
    return;
  }

  try {
    const result = await saveStoreMasterService(storeData);
    res.json({ success: true, message: result.message || "Store saved successfully" });
  } catch (error: any) {
    console.error("SaveStoreMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateStoreMaster = async (req: Request, res: Response): Promise<void> => {
  const storeData: StoreMasterData = req.body;
  const { id } = req.params;

  try {
    if (!storeData.STORE_ID && id) {
      storeData.STORE_ID = parseInt(id as string, 10);
    }

    const result = await updateStoreMasterService(storeData);
    res.json({ success: true, message: result.message || "Store updated successfully" });
  } catch (error: any) {
    console.error("UpdateStoreMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteStoreMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Store ID is required" });
    return;
  }

  try {
    const result = await deleteStoreMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Store deleted successfully" });
  } catch (error: any) {
    console.error("DeleteStoreMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
