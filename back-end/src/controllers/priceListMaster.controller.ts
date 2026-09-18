import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllPriceListMasterService,
  getPriceListMasterByIdService,
  savePriceListMasterService,
  updatePriceListMasterService,
  deletePriceListMasterService,
  PriceListMasterData
} from "../services/priceListMaster.services";

export const getAllPriceListMaster = async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await getAllPriceListMasterService();
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllPriceListMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPriceListMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Price List ID is required" });
    return;
  }

  try {
    const item = await getPriceListMasterByIdService(parseInt(id as string, 10));

    if (!item) {
      res.status(404).json({ success: false, message: "Price list not found" });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetPriceListMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const savePriceListMaster = async (req: Request, res: Response): Promise<void> => {
  const data: PriceListMasterData = req.body;

  if (data.PRICE_TYPE_ID === undefined || data.COMPANY_ID === undefined) {
    res.status(400).json({ success: false, message: "Price Type and Company are required" });
    return;
  }

  try {
    const result = await savePriceListMasterService(data);
    res.json({ success: true, message: result.message || "Price list saved successfully" });
  } catch (error: any) {
    console.error("SavePriceListMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updatePriceListMaster = async (req: Request, res: Response): Promise<void> => {
  const data: PriceListMasterData = req.body;
  const { id } = req.params;

  try {
    if (!data.PRICE_LIST_ID && id) {
      data.PRICE_LIST_ID = parseInt(id as string, 10);
    }

    const result = await updatePriceListMasterService(data);
    res.json({ success: true, message: result.message || "Price list updated successfully" });
  } catch (error: any) {
    console.error("UpdatePriceListMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deletePriceListMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Price List ID is required" });
    return;
  }

  try {
    const result = await deletePriceListMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Price list deleted successfully" });
  } catch (error: any) {
    console.error("DeletePriceListMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
