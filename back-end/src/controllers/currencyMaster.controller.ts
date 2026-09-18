import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllCurrencyMasterService,
  getCurrencyMasterByIdService,
  saveCurrencyMasterService,
  updateCurrencyMasterService,
  deleteCurrencyMasterService,
  CurrencyMasterData
} from "../services/currencyMaster.services";

export const getAllCurrencyMaster = async (_req: Request, res: Response): Promise<void> => {
  try {
    const currencies = await getAllCurrencyMasterService();
    res.json({ success: true, count: currencies.length, data: currencies });
  } catch (error: any) {
    console.error("GetAllCurrencyMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getCurrencyMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Currency ID is required" });
    return;
  }

  try {
    const currency = await getCurrencyMasterByIdService(parseInt(id as string, 10));

    if (!currency) {
      res.status(404).json({ success: false, message: "Currency not found" });
      return;
    }

    res.json({ success: true, data: currency });
  } catch (error: any) {
    console.error("GetCurrencyMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveCurrencyMaster = async (req: Request, res: Response): Promise<void> => {
  const currencyData: CurrencyMasterData = req.body;

  if (!currencyData.CURRENCY_NAME) {
    res.status(400).json({ success: false, message: "Currency Name is required" });
    return;
  }

  try {
    const result = await saveCurrencyMasterService(currencyData);
    res.json({ success: true, message: result.message || "Currency saved successfully" });
  } catch (error: any) {
    console.error("SaveCurrencyMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateCurrencyMaster = async (req: Request, res: Response): Promise<void> => {
  const currencyData: CurrencyMasterData = req.body;
  const { id } = req.params;

  try {
    if (!currencyData.CURRENCY_ID && id) {
      currencyData.CURRENCY_ID = parseInt(id as string, 10);
    }

    const result = await updateCurrencyMasterService(currencyData);
    res.json({ success: true, message: result.message || "Currency updated successfully" });
  } catch (error: any) {
    console.error("UpdateCurrencyMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteCurrencyMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Currency ID is required" });
    return;
  }

  try {
    const result = await deleteCurrencyMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Currency deleted successfully" });
  } catch (error: any) {
    console.error("DeleteCurrencyMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
