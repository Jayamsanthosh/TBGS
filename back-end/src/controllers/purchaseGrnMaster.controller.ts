import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  getPurchaseGrnListService,
  getPurchaseGrnHdrService,
  getPurchaseGrnDtlsService,
  getPurchaseGrnDtlService,
  savePurchaseGrnCombinedService,
  updatePurchaseGrnCombinedService,
  deletePurchaseGrnDtlService,
  deletePurchaseGrnHdrService,
  PurchaseGrnData
} from "../services/purchaseGrnMaster.services";

const toPositiveInt = (v: any): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
};

const toNum = (v: any): number => {
  if (v === "" || v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
};

const validateGrn = (data: PurchaseGrnData, res: Response, isUpdate: boolean): boolean => {
  const bad = (message: string) => {
    res.status(400).json({ success: false, message });
    return false;
  };

  if (!data.PURCHASE_GRN_DATE) return bad("Purchase GRN Date is required");
  if (!data.PURCHASE_ORDER_NO) return bad("Purchase Order no is required - every GRN is raised against a purchase order");
  if (!data.COMPANY_ID) return bad("Company is required");
  if (!data.CAMP_ID) return bad("Camp is required");
  if (!data.STORE_ID) return bad("Store is required");
  if (!data.LOCATION_ID) return bad("Location is required");
  if (!data.SUPPLIER_BP_ID) return bad("Supplier is required");
  if (!data.CURRENCY_ID) return bad("Currency is required");
  if (data.EXCHANGE_RATE === undefined || data.EXCHANGE_RATE === null || data.EXCHANGE_RATE === "") {
    return bad("Exchange Rate is required");
  }
  if (Number(data.EXCHANGE_RATE) <= 0) return bad("Exchange Rate must be greater than 0");
  if (!data.STATUS_ID) return bad("Status is required");
  if (isUpdate && !data.PURCHASE_GRN_REF_NO) return bad("Purchase GRN Reference No is required");

  const dtls = Array.isArray(data.dtls) ? data.dtls : [];
  if (!dtls.length) return bad("At least one purchase GRN detail line is required");

  const seenLines = new Set<number>();
  for (let i = 0; i < dtls.length; i++) {
    const line = i + 1;
    const dtl = dtls[i];
    if (!dtl.PRODUCT_ID) return bad(`Line ${line}: Product is required`);
    if (dtl.LINE_NO !== undefined && dtl.LINE_NO !== null) {
      if (seenLines.has(Number(dtl.LINE_NO))) return bad(`Line ${line}: Line No ${dtl.LINE_NO} is duplicated`);
      seenLines.add(Number(dtl.LINE_NO));
    }
    if (toNum(dtl.RECEIVED_QUANTITY) <= 0) return bad(`Line ${line}: Received Quantity must be greater than 0`);
    if (toNum(dtl.REJECTED_QUANTITY) > toNum(dtl.RECEIVED_QUANTITY)) {
      return bad(`Line ${line}: Rejected Quantity cannot be greater than Received Quantity`);
    }
    if (dtl.MANUFACTURE_DATE && dtl.EXPIRY_DATE && new Date(dtl.EXPIRY_DATE) < new Date(dtl.MANUFACTURE_DATE)) {
      return bad(`Line ${line}: Expiry Date cannot be before Manufacture Date`);
    }
  }

  return true;
};

export const getAllPurchaseGrn = async (req: Request, res: Response): Promise<void> => {
  const { companyId } = req.query;

  try {
    const rows = await getPurchaseGrnListService({ companyId: toPositiveInt(companyId) });
    res.json({ success: true, total: rows.length, count: rows.length, data: rows });
  } catch (error: any) {
    console.error("GetAllPurchaseGrn error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPurchaseGrnHdr = async (req: Request, res: Response): Promise<void> => {
  const { refNo } = req.params;

  if (!refNo) {
    res.status(400).json({ success: false, message: "Purchase GRN Reference No is required" });
    return;
  }

  try {
    const data = await getPurchaseGrnHdrService(refNo as string);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("GetPurchaseGrnHdr error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPurchaseGrnDtls = async (req: Request, res: Response): Promise<void> => {
  const { refNo } = req.params;

  if (!refNo) {
    res.status(400).json({ success: false, message: "Purchase GRN Reference No is required" });
    return;
  }

  try {
    const data = await getPurchaseGrnDtlsService(refNo as string);
    res.json({ success: true, count: data.length, data });
  } catch (error: any) {
    console.error("GetPurchaseGrnDtls error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPurchaseGrnDtl = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const dtlId = toPositiveInt(id);

  if (!dtlId) {
    res.status(400).json({ success: false, message: "Valid purchase GRN detail id is required" });
    return;
  }

  try {
    const data = await getPurchaseGrnDtlService(dtlId);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("GetPurchaseGrnDtl error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const savePurchaseGrn = async (req: Request, res: Response): Promise<void> => {
  const data: PurchaseGrnData = req.body;

  if (!validateGrn(data, res, false)) return;

  try {
    const result = await savePurchaseGrnCombinedService(data);
    res.json({
      success: true,
      message: result.message || "Purchase GRN created successfully",
      PURCHASE_GRN_REF_NO: result.PURCHASE_GRN_REF_NO,
    });
  } catch (error: any) {
    console.error("SavePurchaseGrn error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updatePurchaseGrn = async (req: Request, res: Response): Promise<void> => {
  const data: PurchaseGrnData = req.body;
  const { refNo } = req.params;

  if (!data.PURCHASE_GRN_REF_NO && refNo) {
    data.PURCHASE_GRN_REF_NO = refNo as string;
  }

  if (!validateGrn(data, res, true)) return;

  try {
    const result = await updatePurchaseGrnCombinedService(data);
    res.json({ success: true, message: result.message || "Purchase GRN updated successfully" });
  } catch (error: any) {
    console.error("UpdatePurchaseGrn error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deletePurchaseGrnDtl = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);
  const dtlId = toPositiveInt(id);

  if (!dtlId) {
    res.status(400).json({ success: false, message: "Valid purchase GRN detail id is required" });
    return;
  }

  try {
    const result = await deletePurchaseGrnDtlService(
      dtlId,
      USER || "Admin",
      ROLE || "Admin",
      MAC_ADDRESS || "WEB"
    );
    res.json({ success: true, message: result.message || "Purchase GRN detail deleted successfully" });
  } catch (error: any) {
    console.error("DeletePurchaseGrnDtl error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deletePurchaseGrnHdr = async (req: Request, res: Response): Promise<void> => {
  const { refNo } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!refNo) {
    res.status(400).json({ success: false, message: "Purchase GRN Reference No is required" });
    return;
  }

  try {
    const result = await deletePurchaseGrnHdrService(
      refNo as string,
      USER || "Admin",
      ROLE || "Admin",
      MAC_ADDRESS || "WEB"
    );
    res.json({ success: true, message: result.message || "Purchase GRN deleted successfully" });
  } catch (error: any) {
    console.error("DeletePurchaseGrnHdr error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
