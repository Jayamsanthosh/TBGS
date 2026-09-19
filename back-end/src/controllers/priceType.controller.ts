import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllPriceTypeService,
  getPriceTypeByIdService,
  savePriceTypeService,
  updatePriceTypeService,
  deletePriceTypeService,
  PriceTypeData
} from "../services/priceType.services";

export const getAllPriceType = async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await getAllPriceTypeService();
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllPriceType error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPriceTypeById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ success: false, message: "Price Type ID is required" });
    return;
  }
  try {
    const item = await getPriceTypeByIdService(parseInt(id as string, 10));
    if (!item) {
      res.status(404).json({ success: false, message: "Price type not found" });
      return;
    }
    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetPriceTypeById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const savePriceType = async (req: Request, res: Response): Promise<void> => {
  const data: PriceTypeData = req.body;
  if (!data.PRICE_TYPE_NAME) {
    res.status(400).json({ success: false, message: "Price Type Name is required" });
    return;
  }
  try {
    const result = await savePriceTypeService(data);
    res.json({ success: true, message: result.message || "Price type saved successfully" });
  } catch (error: any) {
    console.error("SavePriceType error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updatePriceType = async (req: Request, res: Response): Promise<void> => {
  const data: PriceTypeData = req.body;
  const { id } = req.params;
  try {
    if (!data.PRICE_TYPE_ID && id) {
      data.PRICE_TYPE_ID = parseInt(id as string, 10);
    }
    const result = await updatePriceTypeService(data);
    res.json({ success: true, message: result.message || "Price type updated successfully" });
  } catch (error: any) {
    console.error("UpdatePriceType error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deletePriceType = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);
  if (!id) {
    res.status(400).json({ success: false, message: "Price Type ID is required" });
    return;
  }
  try {
    const result = await deletePriceTypeService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Price type deleted successfully" });
  } catch (error: any) {
    console.error("DeletePriceType error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
