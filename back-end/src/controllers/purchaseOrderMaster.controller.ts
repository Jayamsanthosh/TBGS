import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  getPurchaseOrderListService,
  getPurchaseOrderHdrService,
  getPurchaseOrderDtlsService,
  getPurchaseOrderDtlService,
  loadPurchaseOrderSourceQuotationsService,
  savePurchaseOrderCombinedService,
  updatePurchaseOrderCombinedService,
  deletePurchaseOrderDtlService,
  deletePurchaseOrderHdrService,
  submitPurchaseOrderService,
  PurchaseOrderData
} from "../services/purchaseOrderMaster.services";

const toPositiveInt = (v: any): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
};

const validateOrder = (data: PurchaseOrderData, res: Response, isUpdate: boolean): boolean => {
  if (!data.PURCHASE_ORDER_DATE) {
    res.status(400).json({ success: false, message: "Purchase Order Date is required" });
    return false;
  }
  if (!data.SUPPLIER_BP_ID) {
    res.status(400).json({ success: false, message: "Supplier is required" });
    return false;
  }
  if (!data.PURCHASE_QUOTATION_NO) {
    res.status(400).json({
      success: false,
      message: "Purchase Quotation no is required - every purchase order must be raised against a quotation",
    });
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

  const dtls = Array.isArray(data.dtls) ? data.dtls : [];
  if (!dtls.length) {
    res.status(400).json({
      success: false,
      message: "At least one purchase order detail line is required",
    });
    return false;
  }

  if (isUpdate && !data.PURCHASE_ORDER_NO) {
    res.status(400).json({ success: false, message: "Purchase Order no is required" });
    return false;
  }

  return true;
};

export const getAllPurchaseOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const rows = await getPurchaseOrderListService();
    res.json({ success: true, total: rows.length, count: rows.length, data: rows });
  } catch (error: any) {
    console.error("GetAllPurchaseOrder error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPurchaseOrderSourceQuotations = async (req: Request, res: Response): Promise<void> => {
  const { companyId, statusEntry, approvalStatus } = req.query;

  try {
    const options = await loadPurchaseOrderSourceQuotationsService(
      toPositiveInt(companyId),
      typeof statusEntry === "string" ? statusEntry || null : null,
      typeof approvalStatus === "string" ? approvalStatus || null : null
    );
    res.json({ success: true, count: options.length, data: options });
  } catch (error: any) {
    console.error("GetPurchaseOrderSourceQuotations error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPurchaseOrderHdr = async (req: Request, res: Response): Promise<void> => {
  const { refNo } = req.params;

  if (!refNo) {
    res.status(400).json({ success: false, message: "Purchase Order no is required" });
    return;
  }

  try {
    const data = await getPurchaseOrderHdrService(refNo as string);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("GetPurchaseOrderHdr error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPurchaseOrderDtls = async (req: Request, res: Response): Promise<void> => {
  const { refNo } = req.params;

  if (!refNo) {
    res.status(400).json({ success: false, message: "Purchase Order no is required" });
    return;
  }

  try {
    const data = await getPurchaseOrderDtlsService(refNo as string);
    res.json({ success: true, count: data.length, data });
  } catch (error: any) {
    console.error("GetPurchaseOrderDtls error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPurchaseOrderDtl = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const dtlId = toPositiveInt(id);

  if (!dtlId) {
    res.status(400).json({ success: false, message: "Valid purchase order detail id is required" });
    return;
  }

  try {
    const data = await getPurchaseOrderDtlService(dtlId);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("GetPurchaseOrderDtl error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const savePurchaseOrder = async (req: Request, res: Response): Promise<void> => {
  const data: PurchaseOrderData = req.body;

  if (!validateOrder(data, res, false)) return;

  try {
    const result = await savePurchaseOrderCombinedService(data);
    res.json({
      success: true,
      message: result.message || "Purchase Order created successfully",
      PURCHASE_ORDER_NO: result.PURCHASE_ORDER_NO,
    });
  } catch (error: any) {
    console.error("SavePurchaseOrder error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updatePurchaseOrder = async (req: Request, res: Response): Promise<void> => {
  const data: PurchaseOrderData = req.body;
  const { refNo } = req.params;

  if (!data.PURCHASE_ORDER_NO && refNo) {
    data.PURCHASE_ORDER_NO = refNo as string;
  }

  if (!validateOrder(data, res, true)) return;

  try {
    const result = await updatePurchaseOrderCombinedService(data);
    res.json({ success: true, message: result.message || "Purchase Order updated successfully" });
  } catch (error: any) {
    console.error("UpdatePurchaseOrder error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deletePurchaseOrderDtl = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);
  const dtlId = toPositiveInt(id);

  if (!dtlId) {
    res.status(400).json({ success: false, message: "Valid purchase order detail id is required" });
    return;
  }

  try {
    const result = await deletePurchaseOrderDtlService(
      dtlId,
      USER || "Admin",
      ROLE || "Admin",
      MAC_ADDRESS || "WEB"
    );
    res.json({ success: true, message: result.message || "Purchase Order detail deleted successfully" });
  } catch (error: any) {
    console.error("DeletePurchaseOrderDtl error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deletePurchaseOrderHdr = async (req: Request, res: Response): Promise<void> => {
  const { refNo } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!refNo) {
    res.status(400).json({ success: false, message: "Purchase Order no is required" });
    return;
  }

  try {
    const result = await deletePurchaseOrderHdrService(
      refNo as string,
      USER || "Admin",
      ROLE || "Admin",
      MAC_ADDRESS || "WEB"
    );
    res.json({ success: true, message: result.message || "Purchase Order deleted successfully" });
  } catch (error: any) {
    console.error("DeletePurchaseOrderHdr error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const submitPurchaseOrder = async (req: Request, res: Response): Promise<void> => {
  const { refNo } = req.params;
  const { USER, MAC_ADDRESS } = identityFrom(req);

  if (!refNo) {
    res.status(400).json({ success: false, message: "Purchase Order no is required" });
    return;
  }

  try {
    const result = await submitPurchaseOrderService(
      refNo as string,
      USER || "Admin",
      MAC_ADDRESS || "WEB"
    );
    res.json({
      success: true,
      message: result.message,
      changed: result.changed,
      order: result.order,
    });
  } catch (error: any) {
    console.error("SubmitPurchaseOrder error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};