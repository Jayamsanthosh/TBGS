import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  getPurchaseQuotationListService,
  getPurchaseQuotationHdrService,
  getPurchaseQuotationDtlsService,
  getPurchaseQuotationDtlService,
  loadPurchaseQuotationOptionsService,
  savePurchaseQuotationCombinedService,
  updatePurchaseQuotationCombinedService,
  deletePurchaseQuotationDtlService,
  deletePurchaseQuotationHdrService,
  submitPurchaseQuotationService,
  PurchaseQuotationData
} from "../services/purchaseQuotationMaster.services";

const toPositiveInt = (v: any): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
};

export const getAllPurchaseQuotation = async (req: Request, res: Response): Promise<void> => {
  const { status, search, fromDate, toDate, companyId, supplierBpId, page, pageSize } = req.query;

  try {
    const result = await getPurchaseQuotationListService({
      status: typeof status === "string" ? status : "ALL",
      search: typeof search === "string" ? search : null,
      fromDate: typeof fromDate === "string" ? fromDate : null,
      toDate: typeof toDate === "string" ? toDate : null,
      companyId: toPositiveInt(companyId),
      supplierBpId: toPositiveInt(supplierBpId),
      page: toPositiveInt(page),
      pageSize: toPositiveInt(pageSize),
    });
    res.json({ success: true, total: result.total, count: result.rows.length, data: result.rows });
  } catch (error: any) {
    console.error("GetAllPurchaseQuotation error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPurchaseQuotationHdr = async (req: Request, res: Response): Promise<void> => {
  const { refNo } = req.params;

  if (!refNo) {
    res.status(400).json({ success: false, message: "Purchase Quotation no is required" });
    return;
  }

  try {
    const data = await getPurchaseQuotationHdrService(refNo as string);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("GetPurchaseQuotationHdr error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPurchaseQuotationDtls = async (req: Request, res: Response): Promise<void> => {
  const { refNo } = req.params;

  if (!refNo) {
    res.status(400).json({ success: false, message: "Purchase Quotation no is required" });
    return;
  }

  try {
    const data = await getPurchaseQuotationDtlsService(refNo as string);
    res.json({ success: true, count: data.length, data });
  } catch (error: any) {
    console.error("GetPurchaseQuotationDtls error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPurchaseQuotationDtl = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const dtlId = toPositiveInt(id);

  if (!dtlId) {
    res.status(400).json({ success: false, message: "Valid purchase quotation detail id is required" });
    return;
  }

  try {
    const data = await getPurchaseQuotationDtlService(dtlId);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("GetPurchaseQuotationDtl error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPurchaseQuotationLoad = async (req: Request, res: Response): Promise<void> => {
  const { companyId, supplierBpId, statusEntry, approvalStatus } = req.query;

  try {
    const options = await loadPurchaseQuotationOptionsService(
      toPositiveInt(companyId),
      toPositiveInt(supplierBpId),
      typeof statusEntry === "string" ? statusEntry || null : null,
      typeof approvalStatus === "string" ? approvalStatus || null : null
    );
    res.json({ success: true, count: options.length, data: options });
  } catch (error: any) {
    console.error("GetPurchaseQuotationLoad error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const savePurchaseQuotation = async (req: Request, res: Response): Promise<void> => {
  const data: PurchaseQuotationData = req.body;

  if (!data.PURCHASE_QUOTATION_DATE) {
    res.status(400).json({ success: false, message: "Purchase Quotation Date is required" });
    return;
  }
  if (!data.SUPPLIER_BP_ID) {
    res.status(400).json({ success: false, message: "Supplier is required" });
    return;
  }
  if (!data.CURRENCY_ID) {
    res.status(400).json({ success: false, message: "Currency is required" });
    return;
  }
  if (data.EXCHANGE_RATE === undefined || data.EXCHANGE_RATE === null || data.EXCHANGE_RATE === "") {
    res.status(400).json({ success: false, message: "Exchange Rate is required" });
    return;
  }
  if (Number(data.EXCHANGE_RATE) <= 0) {
    res.status(400).json({ success: false, message: "Exchange Rate must be greater than 0" });
    return;
  }

  const dtls = Array.isArray(data.dtls) ? data.dtls : [];
  if (!dtls.length) {
    res.status(400).json({
      success: false,
      message: "At least one purchase quotation detail line is required",
    });
    return;
  }

  try {
    const result = await savePurchaseQuotationCombinedService(data);
    res.json({
      success: true,
      message: result.message || "Purchase Quotation created successfully",
      PURCHASE_QUOTATION_NO: result.PURCHASE_QUOTATION_NO,
    });
  } catch (error: any) {
    console.error("SavePurchaseQuotation error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updatePurchaseQuotation = async (req: Request, res: Response): Promise<void> => {
  const data: PurchaseQuotationData = req.body;
  const { refNo } = req.params;

  if (!data.PURCHASE_QUOTATION_DATE) {
    res.status(400).json({ success: false, message: "Purchase Quotation Date is required" });
    return;
  }
  if (!data.SUPPLIER_BP_ID) {
    res.status(400).json({ success: false, message: "Supplier is required" });
    return;
  }
  if (!data.CURRENCY_ID) {
    res.status(400).json({ success: false, message: "Currency is required" });
    return;
  }
  if (data.EXCHANGE_RATE === undefined || data.EXCHANGE_RATE === null || data.EXCHANGE_RATE === "") {
    res.status(400).json({ success: false, message: "Exchange Rate is required" });
    return;
  }
  if (Number(data.EXCHANGE_RATE) <= 0) {
    res.status(400).json({ success: false, message: "Exchange Rate must be greater than 0" });
    return;
  }

  try {
    if (!data.PURCHASE_QUOTATION_NO && refNo) {
      data.PURCHASE_QUOTATION_NO = refNo as string;
    }

    if (!data.PURCHASE_QUOTATION_NO) {
      res.status(400).json({ success: false, message: "Purchase Quotation no is required" });
      return;
    }

    const result = await updatePurchaseQuotationCombinedService(data);
    res.json({ success: true, message: result.message || "Purchase Quotation updated successfully" });
  } catch (error: any) {
    console.error("UpdatePurchaseQuotation error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deletePurchaseQuotationDtl = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);
  const dtlId = toPositiveInt(id);

  if (!dtlId) {
    res.status(400).json({ success: false, message: "Valid purchase quotation detail id is required" });
    return;
  }

  try {
    const result = await deletePurchaseQuotationDtlService(
      dtlId,
      USER || "Admin",
      ROLE || "Admin",
      MAC_ADDRESS || "WEB"
    );
    res.json({ success: true, message: result.message || "Purchase Quotation detail deleted successfully" });
  } catch (error: any) {
    console.error("DeletePurchaseQuotationDtl error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deletePurchaseQuotationHdr = async (req: Request, res: Response): Promise<void> => {
  const { refNo } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!refNo) {
    res.status(400).json({ success: false, message: "Purchase Quotation no is required" });
    return;
  }

  try {
    const result = await deletePurchaseQuotationHdrService(
      refNo as string,
      USER || "Admin",
      ROLE || "Admin",
      MAC_ADDRESS || "WEB"
    );
    res.json({ success: true, message: result.message || "Purchase Quotation deleted successfully" });
  } catch (error: any) {
    console.error("DeletePurchaseQuotationHdr error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const submitPurchaseQuotation = async (req: Request, res: Response): Promise<void> => {
  const { refNo } = req.params;
  const { USER, MAC_ADDRESS } = identityFrom(req);
  const statusId = toPositiveInt(req.body?.quotationStatusId);

  if (!refNo) {
    res.status(400).json({ success: false, message: "Purchase Quotation no is required" });
    return;
  }

  if (!statusId) {
    res.status(400).json({ success: false, message: "quotationStatusId is required to submit" });
    return;
  }

  try {
    const result = await submitPurchaseQuotationService(
      refNo as string,
      statusId,
      USER || "Admin",
      MAC_ADDRESS || "WEB"
    );
    res.json({
      success: true,
      message: result.message,
      changed: result.changed,
      quotation: result.quotation,
    });
  } catch (error: any) {
    console.error("SubmitPurchaseQuotation error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
