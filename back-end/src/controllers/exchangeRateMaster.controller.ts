import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllExchangeRateMasterService,
  getExchangeRateMasterByIdService,
  saveExchangeRateMasterService,
  updateExchangeRateMasterService,
  deleteExchangeRateMasterService,
  ExchangeRateMasterData
} from "../services/exchangeRateMaster.services";

export const getAllExchangeRateMaster = async (_req: Request, res: Response): Promise<void> => {
  try {
    const records = await getAllExchangeRateMasterService();
    res.json({ success: true, count: records.length, data: records });
  } catch (error: any) {
    console.error("GetAllExchangeRateMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getExchangeRateMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Exchange rate SNO is required" });
    return;
  }

  try {
    const record = await getExchangeRateMasterByIdService(parseInt(id as string, 10));

    if (!record) {
      res.status(404).json({ success: false, message: "Exchange rate not found" });
      return;
    }

    res.json({ success: true, data: record });
  } catch (error: any) {
    console.error("GetExchangeRateMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveExchangeRateMaster = async (req: Request, res: Response): Promise<void> => {
  const data: ExchangeRateMasterData = req.body;

  if (!data.COMPANY_ID) {
    res.status(400).json({ success: false, message: "Company ID is required" });
    return;
  }

  if (!data.FROM_CURRENCY_ID) {
    res.status(400).json({ success: false, message: "From Currency ID is required" });
    return;
  }

  if (!data.TO_CURRENCY_ID) {
    res.status(400).json({ success: false, message: "To Currency ID is required" });
    return;
  }

  try {
    const result = await saveExchangeRateMasterService(data);
    res.json({ success: true, message: result.message || "Exchange rate saved successfully" });
  } catch (error: any) {
    console.error("SaveExchangeRateMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateExchangeRateMaster = async (req: Request, res: Response): Promise<void> => {
  const data: ExchangeRateMasterData = req.body;
  const { id } = req.params;

  try {
    if (!data.SNO && id) {
      data.SNO = parseInt(id as string, 10);
    }

    const result = await updateExchangeRateMasterService(data);
    res.json({ success: true, message: result.message || "Exchange rate updated successfully" });
  } catch (error: any) {
    console.error("UpdateExchangeRateMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteExchangeRateMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Exchange rate SNO is required" });
    return;
  }

  try {
    const result = await deleteExchangeRateMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Exchange rate deleted successfully" });
  } catch (error: any) {
    console.error("DeleteExchangeRateMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
