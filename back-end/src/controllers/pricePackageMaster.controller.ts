import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllPricePackageMasterService,
  getPricePackageMasterByIdService,
  savePricePackageMasterService,
  updatePricePackageMasterService,
  deletePricePackageMasterService,
  PricePackageMasterData
} from "../services/pricePackageMaster.services";

export const getAllPricePackageMaster = async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await getAllPricePackageMasterService();
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllPricePackageMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPricePackageMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Price Package ID is required" });
    return;
  }

  try {
    const item = await getPricePackageMasterByIdService(parseInt(id as string, 10));

    if (!item) {
      res.status(404).json({ success: false, message: "Price package not found" });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetPricePackageMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const savePricePackageMaster = async (req: Request, res: Response): Promise<void> => {
  const data: PricePackageMasterData = req.body;

  if (!data.PRICE_PACKAGE_NAME) {
    res.status(400).json({ success: false, message: "Price Package Name is required" });
    return;
  }

  try {
    const result = await savePricePackageMasterService(data);
    res.json({ success: true, message: result.message || "Price package saved successfully" });
  } catch (error: any) {
    console.error("SavePricePackageMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updatePricePackageMaster = async (req: Request, res: Response): Promise<void> => {
  const data: PricePackageMasterData = req.body;
  const { id } = req.params;

  try {
    if (!data.PRICE_PACKAGE_ID && id) {
      data.PRICE_PACKAGE_ID = parseInt(id as string, 10);
    }

    const result = await updatePricePackageMasterService(data);
    res.json({ success: true, message: result.message || "Price package updated successfully" });
  } catch (error: any) {
    console.error("UpdatePricePackageMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deletePricePackageMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Price Package ID is required" });
    return;
  }

  try {
    const result = await deletePricePackageMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Price package deleted successfully" });
  } catch (error: any) {
    console.error("DeletePricePackageMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
