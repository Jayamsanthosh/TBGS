import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  getPurchaseInvoiceListService,
  getPurchaseInvoiceHdrService,
  getPurchaseInvoiceDtlsService,
  getPurchaseInvoiceDtlService,
  loadPurchaseInvoiceSourceOrdersService,
  getPurchaseInvoiceSourceOrderService,
  savePurchaseInvoiceCombinedService,
  updatePurchaseInvoiceCombinedService,
  deletePurchaseInvoiceDtlService,
  deletePurchaseInvoiceHdrService,
  getPurchaseInvoiceAdditionalChargesService,
  getPurchaseInvoiceAdditionalChargeService,
  savePurchaseInvoiceAdditionalChargeService,
  updatePurchaseInvoiceAdditionalChargeService,
  deletePurchaseInvoiceAdditionalChargeService,
  PurchaseInvoiceData,
  PurchaseInvoiceAdditionalChargeData,
} from "../services/purchaseInvoiceMaster.services";

const toPositiveInt = (v: any): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
};

const validateInvoice = (data: PurchaseInvoiceData, res: Response, isUpdate: boolean): boolean => {
  if (!data.PURCHASE_INVOICE_DATE) {
    res.status(400).json({ success: false, message: "Purchase Invoice Date is required" });
    return false;
  }
  if (!data.SUPPLIER_INVOICE_NO || !String(data.SUPPLIER_INVOICE_NO).trim()) {
    res.status(400).json({ success: false, message: "Supplier Invoice No is required" });
    return false;
  }
  if (!data.SUPPLIER_INVOICE_DATE) {
    res.status(400).json({ success: false, message: "Supplier Invoice Date is required" });
    return false;
  }
  if (!data.SUPPLIER_BP_ID) {
    res.status(400).json({ success: false, message: "Supplier is required" });
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
  if (isUpdate && !data.PURCHASE_INVOICE_REF_NO) {
    res.status(400).json({ success: false, message: "Purchase Invoice Ref No is required" });
    return false;
  }

  const dtls = Array.isArray(data.dtls) ? data.dtls : [];
  if (!dtls.length) {
    res.status(400).json({ success: false, message: "At least one invoice line is required" });
    return false;
  }

  return true;
};

export const getAllPurchaseInvoice = async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = await getPurchaseInvoiceListService();
    res.json({ success: true, total: rows.length, count: rows.length, data: rows });
  } catch (error: any) {
    console.error("GetAllPurchaseInvoice error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPurchaseInvoiceSourceOrders = async (req: Request, res: Response): Promise<void> => {
  const { companyId } = req.query;
  try {
    const rows = await loadPurchaseInvoiceSourceOrdersService(toPositiveInt(companyId));
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error: any) {
    console.error("GetPurchaseInvoiceSourceOrders error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPurchaseInvoiceSourceOrder = async (req: Request, res: Response): Promise<void> => {
  const { poNo } = req.params;
  if (!poNo) {
    res.status(400).json({ success: false, message: "Purchase Order No is required" });
    return;
  }
  try {
    const data = await getPurchaseInvoiceSourceOrderService(poNo as string);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("GetPurchaseInvoiceSourceOrder error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPurchaseInvoiceHdr = async (req: Request, res: Response): Promise<void> => {
  const { refNo } = req.params;
  if (!refNo) {
    res.status(400).json({ success: false, message: "Purchase Invoice Ref No is required" });
    return;
  }
  try {
    const data = await getPurchaseInvoiceHdrService(refNo as string);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("GetPurchaseInvoiceHdr error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPurchaseInvoiceDtls = async (req: Request, res: Response): Promise<void> => {
  const { refNo } = req.params;
  if (!refNo) {
    res.status(400).json({ success: false, message: "Purchase Invoice Ref No is required" });
    return;
  }
  try {
    const data = await getPurchaseInvoiceDtlsService(refNo as string);
    res.json({ success: true, count: data.length, data });
  } catch (error: any) {
    console.error("GetPurchaseInvoiceDtls error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPurchaseInvoiceDtl = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const dtlId = toPositiveInt(id);
  if (!dtlId) {
    res.status(400).json({ success: false, message: "Valid invoice detail id is required" });
    return;
  }
  try {
    const data = await getPurchaseInvoiceDtlService(dtlId);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("GetPurchaseInvoiceDtl error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const savePurchaseInvoice = async (req: Request, res: Response): Promise<void> => {
  const data: PurchaseInvoiceData = req.body;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);
  data.USER = data.USER || USER || "Admin";
  data.ROLE = data.ROLE || ROLE || "Admin";
  data.MAC_ADDRESS = data.MAC_ADDRESS || MAC_ADDRESS || "WEB";

  if (!validateInvoice(data, res, false)) return;

  try {
    const result = await savePurchaseInvoiceCombinedService(data);
    res.json({
      success: true,
      message: result.message || "Purchase Invoice created successfully",
      PURCHASE_INVOICE_REF_NO: result.PURCHASE_INVOICE_REF_NO,
    });
  } catch (error: any) {
    console.error("SavePurchaseInvoice error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updatePurchaseInvoice = async (req: Request, res: Response): Promise<void> => {
  const data: PurchaseInvoiceData = req.body;
  const { refNo } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);
  if (!data.PURCHASE_INVOICE_REF_NO && refNo) data.PURCHASE_INVOICE_REF_NO = refNo as string;
  data.USER = data.USER || USER || "Admin";
  data.ROLE = data.ROLE || ROLE || "Admin";
  data.MAC_ADDRESS = data.MAC_ADDRESS || MAC_ADDRESS || "WEB";

  if (!validateInvoice(data, res, true)) return;

  try {
    const result = await updatePurchaseInvoiceCombinedService(data);
    res.json({ success: true, message: result.message || "Purchase Invoice updated successfully" });
  } catch (error: any) {
    console.error("UpdatePurchaseInvoice error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deletePurchaseInvoiceDtl = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const dtlId = toPositiveInt(id);
  if (!dtlId) {
    res.status(400).json({ success: false, message: "Valid invoice detail id is required" });
    return;
  }
  try {
    const result = await deletePurchaseInvoiceDtlService(dtlId);
    res.json({ success: true, message: result.message });
  } catch (error: any) {
    console.error("DeletePurchaseInvoiceDtl error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deletePurchaseInvoiceHdr = async (req: Request, res: Response): Promise<void> => {
  const { refNo } = req.params;
  if (!refNo) {
    res.status(400).json({ success: false, message: "Purchase Invoice Ref No is required" });
    return;
  }
  try {
    const result = await deletePurchaseInvoiceHdrService(refNo as string);
    res.json({ success: true, message: result.message });
  } catch (error: any) {
    console.error("DeletePurchaseInvoiceHdr error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPurchaseInvoiceAdditionalCharges = async (req: Request, res: Response): Promise<void> => {
  const { refNo } = req.params;
  if (!refNo) {
    res.status(400).json({ success: false, message: "Purchase Invoice Ref No is required" });
    return;
  }
  try {
    const data = await getPurchaseInvoiceAdditionalChargesService(refNo as string);
    res.json({ success: true, count: data.length, data });
  } catch (error: any) {
    console.error("GetPurchaseInvoiceAdditionalCharges error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPurchaseInvoiceAdditionalCharge = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const chargeId = toPositiveInt(id);
  if (!chargeId) {
    res.status(400).json({ success: false, message: "Valid additional charges id is required" });
    return;
  }
  try {
    const data = await getPurchaseInvoiceAdditionalChargeService(chargeId);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("GetPurchaseInvoiceAdditionalCharge error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const savePurchaseInvoiceAdditionalCharge = async (req: Request, res: Response): Promise<void> => {
  const data: PurchaseInvoiceAdditionalChargeData = req.body;
  const { USER, MAC_ADDRESS } = identityFrom(req);

  if (!data.PURCHASE_INVOICE_REF_NO) {
    res.status(400).json({ success: false, message: "Purchase Invoice Ref No is required" });
    return;
  }
  if (!data.ADDITIONAL_CHARGE_TYPE_ID) {
    res.status(400).json({ success: false, message: "Additional charge type is required" });
    return;
  }
  if (data.RATE_FC === undefined || data.RATE_FC === null || data.RATE_FC === "" || Number(data.RATE_FC) < 0) {
    res.status(400).json({ success: false, message: "A valid rate is required" });
    return;
  }

  try {
    const result = await savePurchaseInvoiceAdditionalChargeService({
      ...data,
      USER: USER || "Admin",
      MAC_ADDRESS: MAC_ADDRESS || "WEB",
    });
    res.json({
      success: true,
      message: result.message || "Additional Charge saved successfully",
      PURCHASE_INVOICE_ADDITIONAL_CHARGES_DTL_ID: result.id,
    });
  } catch (error: any) {
    console.error("SavePurchaseInvoiceAdditionalCharge error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updatePurchaseInvoiceAdditionalCharge = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const chargeId = toPositiveInt(id);
  if (!chargeId) {
    res.status(400).json({ success: false, message: "Valid additional charges id is required" });
    return;
  }

  const data: PurchaseInvoiceAdditionalChargeData = req.body;
  const { USER, MAC_ADDRESS } = identityFrom(req);
  if (!data.PURCHASE_INVOICE_REF_NO) {
    res.status(400).json({ success: false, message: "Purchase Invoice Ref No is required" });
    return;
  }

  try {
    const result = await updatePurchaseInvoiceAdditionalChargeService({
      ...data,
      PURCHASE_INVOICE_ADDITIONAL_CHARGES_DTL_ID: chargeId,
      USER: USER || "Admin",
      MAC_ADDRESS: MAC_ADDRESS || "WEB",
    });
    res.json({ success: true, message: result.message || "Additional Charge updated successfully" });
  } catch (error: any) {
    console.error("UpdatePurchaseInvoiceAdditionalCharge error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deletePurchaseInvoiceAdditionalCharge = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const chargeId = toPositiveInt(id);
  if (!chargeId) {
    res.status(400).json({ success: false, message: "Valid additional charges id is required" });
    return;
  }
  try {
    const result = await deletePurchaseInvoiceAdditionalChargeService(chargeId);
    res.json({ success: true, message: result.message });
  } catch (error: any) {
    console.error("DeletePurchaseInvoiceAdditionalCharge error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
