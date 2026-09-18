import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllPriceTypeMasterService,
  getPriceTypeMasterByIdService,
  savePriceTypeMasterService,
  updatePriceTypeMasterService,
  deletePriceTypeMasterService,
  PriceTypeMasterData
} from "../services/priceTypeMaster.services";

export const getAllPriceTypeMaster = async (_req: Request, res: Response): Promise<void> => {
  try {
    const priceTypes = await getAllPriceTypeMasterService();
    res.json({ success: true, count: priceTypes.length, data: priceTypes });
  } catch (error: any) {
    console.error("GetAllPriceTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPriceTypeMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Price Type ID is required" });
    return;
  }

  try {
    const priceType = await getPriceTypeMasterByIdService(parseInt(id as string, 10));

    if (!priceType) {
      res.status(404).json({ success: false, message: "Price type not found" });
      return;
    }

    res.json({ success: true, data: priceType });
  } catch (error: any) {
    console.error("GetPriceTypeMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const savePriceTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const priceTypeData: PriceTypeMasterData = req.body;

  if (!priceTypeData.PRICE_TYPE_NAME) {
    res.status(400).json({ success: false, message: "Price Type Name is required" });
    return;
  }

  try {
    const result = await savePriceTypeMasterService(priceTypeData);
    res.json({ success: true, message: result.message || "Price type saved successfully" });
  } catch (error: any) {
    console.error("SavePriceTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updatePriceTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const priceTypeData: PriceTypeMasterData = req.body;
  const { id } = req.params;

  try {
    if (!priceTypeData.PRICE_TYPE_ID && id) {
      priceTypeData.PRICE_TYPE_ID = parseInt(id as string, 10);
    }

    const result = await updatePriceTypeMasterService(priceTypeData);
    res.json({ success: true, message: result.message || "Price type updated successfully" });
  } catch (error: any) {
    console.error("UpdatePriceTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deletePriceTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Price Type ID is required" });
    return;
  }

  try {
    const result = await deletePriceTypeMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Price type deleted successfully" });
  } catch (error: any) {
    console.error("DeletePriceTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
