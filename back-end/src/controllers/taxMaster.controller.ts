import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  getAllTaxMasterService,
  getTaxMasterByIdService,
  saveTaxMasterService,
  updateTaxMasterService,
  deleteTaxMasterService,
  TaxMasterData
} from "../services/taxMaster.services";

export const getAllTaxMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
    const records = await getAllTaxMasterService(status);
    res.json({ success: true, count: records.length, data: records });
  } catch (error: any) {
    console.error("GetAllTaxMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getTaxMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Tax ID is required" });
    return;
  }

  try {
    const record = await getTaxMasterByIdService(parseInt(id as string, 10));

    if (!record) {
      res.status(404).json({ success: false, message: "Tax not found" });
      return;
    }

    res.json({ success: true, data: record });
  } catch (error: any) {
    console.error("GetTaxMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

const isDateAfter = (from: string, to: string): boolean => {
  const fromTime = new Date(from).getTime();
  const toTime = new Date(to).getTime();
  return !isNaN(fromTime) && !isNaN(toTime) && toTime < fromTime;
};

const validateTaxData = (data: TaxMasterData): string | null => {
  if (!data.TAX_CODE || !String(data.TAX_CODE).trim()) {
    return "Tax Code is required";
  }
  if (!data.TAX_NAME || !String(data.TAX_NAME).trim()) {
    return "Tax Name is required";
  }
  if (!data.TAX_TYPE || !String(data.TAX_TYPE).trim()) {
    return "Tax Type is required";
  }

  const percentage = data.TAX_PERCENTAGE;
  const isVat = String(data.TAX_TYPE).trim().toUpperCase() === "VAT";
  if (isVat && (percentage == null)) {
    return "Tax Percentage is required for VAT";
  }
  if (percentage != null) {
    const num = Number(percentage);
    if (Number.isNaN(num)) {
      return "Tax Percentage must be a valid number";
    }
    if (num < 0 || num > 100) {
      return "Tax Percentage must be between 0 and 100";
    }
  }

  if (data.EFFECTIVE_FROM && data.EFFECTIVE_TO && isDateAfter(data.EFFECTIVE_FROM, data.EFFECTIVE_TO)) {
    return "Effective To date cannot be before Effective From date";
  }

  return null;
};

export const saveTaxMaster = async (req: Request, res: Response): Promise<void> => {
  const data: TaxMasterData = req.body;

  const validationError = validateTaxData(data);
  if (validationError) {
    res.status(400).json({ success: false, message: validationError });
    return;
  }

  try {
    const result = await saveTaxMasterService(data);
    res.json({ success: true, message: result.message || "Tax saved successfully", TAX_ID: result.TAX_ID });
  } catch (error: any) {
    console.error("SaveTaxMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateTaxMaster = async (req: Request, res: Response): Promise<void> => {
  const data: TaxMasterData = req.body;
  const { id } = req.params;

  const validationError = validateTaxData(data);
  if (validationError) {
    res.status(400).json({ success: false, message: validationError });
    return;
  }

  try {
    if (!data.TAX_ID && id) {
      data.TAX_ID = parseInt(id as string, 10);
    }

    const result = await updateTaxMasterService(data);
    res.json({ success: true, message: result.message || "Tax updated successfully", TAX_ID: result.TAX_ID });
  } catch (error: any) {
    console.error("UpdateTaxMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteTaxMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Tax ID is required" });
    return;
  }

  try {
    const result = await deleteTaxMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Tax deleted successfully" });
  } catch (error: any) {
    console.error("DeleteTaxMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};