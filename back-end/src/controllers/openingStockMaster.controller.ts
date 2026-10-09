import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  getOpeningStockListService,
  getOpeningStockHdrService,
  getOpeningStockDtlsService,
  getOpeningStockDtlService,
  saveOpeningStockCombinedService,
  updateOpeningStockCombinedService,
  deleteOpeningStockDtlService,
  deleteOpeningStockHdrService,
  OpeningStockData
} from "../services/openingStockMaster.services";

const toPositiveInt = (v: any): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
};

const validateHeader = (data: OpeningStockData, res: Response, isUpdate: boolean): boolean => {
  if (!data.OPENING_STOCK_DATE) {
    res.status(400).json({ success: false, message: "Opening Stock Date is required" });
    return false;
  }
  if (!data.COMPANY_ID) {
    res.status(400).json({ success: false, message: "Company is required" });
    return false;
  }
  if (!data.CAMP_ID) {
    res.status(400).json({ success: false, message: "Camp is required" });
    return false;
  }
  if (!data.STORE_ID) {
    res.status(400).json({ success: false, message: "Store is required" });
    return false;
  }
  if (!data.LOCATION_ID) {
    res.status(400).json({ success: false, message: "Location is required" });
    return false;
  }
  if (!data.CURRENCY_ID) {
    res.status(400).json({ success: false, message: "Currency is required" });
    return false;
  }
  if (data.EXCHANGE_RATE === undefined || data.EXCHANGE_RATE === null || data.EXCHANGE_RATE === "") {
    res.status(400).json({ success: false, message: "Exchange Rate is required" });
    return false;
  }
  if (Number(data.EXCHANGE_RATE) <= 0) {
    res.status(400).json({ success: false, message: "Exchange Rate must be greater than 0" });
    return false;
  }
  if (!data.STATUS_ID) {
    res.status(400).json({ success: false, message: "Status is required" });
    return false;
  }

  const dtls = Array.isArray(data.dtls) ? data.dtls : [];
  if (!dtls.length) {
    res.status(400).json({ success: false, message: "At least one opening stock detail line is required" });
    return false;
  }

  if (isUpdate && !data.OPENING_STOCK_REF_NO) {
    res.status(400).json({ success: false, message: "Opening Stock Reference No is required" });
    return false;
  }

  return true;
};

export const getAllOpeningStock = async (req: Request, res: Response): Promise<void> => {
  const { companyId } = req.query;

  try {
    const rows = await getOpeningStockListService({
      companyId: toPositiveInt(companyId),
    });
    res.json({ success: true, total: rows.length, count: rows.length, data: rows });
  } catch (error: any) {
    console.error("GetAllOpeningStock error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getOpeningStockHdr = async (req: Request, res: Response): Promise<void> => {
  const { refNo } = req.params;

  if (!refNo) {
    res.status(400).json({ success: false, message: "Opening Stock Reference No is required" });
    return;
  }

  try {
    const data = await getOpeningStockHdrService(refNo as string);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("GetOpeningStockHdr error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getOpeningStockDtls = async (req: Request, res: Response): Promise<void> => {
  const { refNo } = req.params;

  if (!refNo) {
    res.status(400).json({ success: false, message: "Opening Stock Reference No is required" });
    return;
  }

  try {
    const data = await getOpeningStockDtlsService(refNo as string);
    res.json({ success: true, count: data.length, data });
  } catch (error: any) {
    console.error("GetOpeningStockDtls error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getOpeningStockDtl = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const dtlId = toPositiveInt(id);

  if (!dtlId) {
    res.status(400).json({ success: false, message: "Valid opening stock detail id is required" });
    return;
  }

  try {
    const data = await getOpeningStockDtlService(dtlId);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("GetOpeningStockDtl error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveOpeningStock = async (req: Request, res: Response): Promise<void> => {
  const data: OpeningStockData = req.body;

  if (!validateHeader(data, res, false)) return;

  try {
    const result = await saveOpeningStockCombinedService(data);
    res.json({
      success: true,
      message: result.message || "Opening Stock created successfully",
      OPENING_STOCK_REF_NO: result.OPENING_STOCK_REF_NO,
    });
  } catch (error: any) {
    console.error("SaveOpeningStock error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateOpeningStock = async (req: Request, res: Response): Promise<void> => {
  const data: OpeningStockData = req.body;
  const { refNo } = req.params;

  if (!data.OPENING_STOCK_REF_NO && refNo) {
    data.OPENING_STOCK_REF_NO = refNo as string;
  }

  if (!validateHeader(data, res, true)) return;

  try {
    const result = await updateOpeningStockCombinedService(data);
    res.json({ success: true, message: result.message || "Opening Stock updated successfully" });
  } catch (error: any) {
    console.error("UpdateOpeningStock error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteOpeningStockDtl = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);
  const dtlId = toPositiveInt(id);

  if (!dtlId) {
    res.status(400).json({ success: false, message: "Valid opening stock detail id is required" });
    return;
  }

  try {
    const result = await deleteOpeningStockDtlService(
      dtlId,
      USER || "Admin",
      ROLE || "Admin",
      MAC_ADDRESS || "WEB"
    );
    res.json({ success: true, message: result.message || "Opening Stock detail deleted successfully" });
  } catch (error: any) {
    console.error("DeleteOpeningStockDtl error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteOpeningStockHdr = async (req: Request, res: Response): Promise<void> => {
  const { refNo } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!refNo) {
    res.status(400).json({ success: false, message: "Opening Stock Reference No is required" });
    return;
  }

  try {
    const result = await deleteOpeningStockHdrService(
      refNo as string,
      USER || "Admin",
      ROLE || "Admin",
      MAC_ADDRESS || "WEB"
    );
    res.json({ success: true, message: result.message || "Opening Stock deleted successfully" });
  } catch (error: any) {
    console.error("DeleteOpeningStockHdr error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};