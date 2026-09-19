import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllPricePackageService,
  getPricePackageByIdService,
  savePricePackageService,
  updatePricePackageService,
  deletePricePackageService,
  PricePackageData
} from "../services/pricePackage.services";

export const getAllPricePackage = async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await getAllPricePackageService();
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllPricePackage error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPricePackageById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ success: false, message: "Price Package ID is required" });
    return;
  }
  try {
    const item = await getPricePackageByIdService(parseInt(id as string, 10));
    if (!item) {
      res.status(404).json({ success: false, message: "Price package not found" });
      return;
    }
    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetPricePackageById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const savePricePackage = async (req: Request, res: Response): Promise<void> => {
  const data: PricePackageData = req.body;
  if (!data.PRICE_PACKAGE_NAME) {
    res.status(400).json({ success: false, message: "Price Package Name is required" });
    return;
  }
  try {
    const result = await savePricePackageService(data);
    res.json({ success: true, message: result.message || "Price package saved successfully" });
  } catch (error: any) {
    console.error("SavePricePackage error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updatePricePackage = async (req: Request, res: Response): Promise<void> => {
  const data: PricePackageData = req.body;
  const { id } = req.params;
  try {
    if (!data.PRICE_PACKAGE_ID && id) {
      data.PRICE_PACKAGE_ID = parseInt(id as string, 10);
    }
    const result = await updatePricePackageService(data);
    res.json({ success: true, message: result.message || "Price package updated successfully" });
  } catch (error: any) {
    console.error("UpdatePricePackage error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deletePricePackage = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);
  if (!id) {
    res.status(400).json({ success: false, message: "Price Package ID is required" });
    return;
  }
  try {
    const result = await deletePricePackageService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Price package deleted successfully" });
  } catch (error: any) {
    console.error("DeletePricePackage error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
