import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  getPurchaseQuotationAdditionalChargesService,
  getPurchaseQuotationAdditionalChargeService,
  savePurchaseQuotationAdditionalChargeService,
  updatePurchaseQuotationAdditionalChargeService,
  deletePurchaseQuotationAdditionalChargeService,
  PurchaseQuotationAdditionalChargeData
} from "../services/purchaseQuotationAdditionalCharge.services";

const toPositiveInt = (v: any): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
};

export const getPurchaseQuotationAdditionalCharges = async (req: Request, res: Response): Promise<void> => {
  const { refNo } = req.params;

  if (!refNo) {
    res.status(400).json({ success: false, message: "Purchase Quotation no is required" });
    return;
  }

  try {
    const data = await getPurchaseQuotationAdditionalChargesService(refNo as string);
    res.json({ success: true, count: data.length, data });
  } catch (error: any) {
    console.error("GetPurchaseQuotationAdditionalCharges error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPurchaseQuotationAdditionalCharge = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const chargeId = toPositiveInt(id);

  if (!chargeId) {
    res.status(400).json({ success: false, message: "Valid additional charges id is required" });
    return;
  }

  try {
    const data = await getPurchaseQuotationAdditionalChargeService(chargeId);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("GetPurchaseQuotationAdditionalCharge error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const savePurchaseQuotationAdditionalCharge = async (req: Request, res: Response): Promise<void> => {
  const data: PurchaseQuotationAdditionalChargeData = req.body;
  const { USER, MAC_ADDRESS } = identityFrom(req);

  if (!data.PURCHASE_QUOTATION_NO) {
    res.status(400).json({ success: false, message: "Purchase Quotation no is required" });
    return;
  }
  if (!data.ADDITIONAL_CHARGE_TYPE_ID) {
    res.status(400).json({ success: false, message: "Additional charge type is required" });
    return;
  }
  if (data.RATE === undefined || data.RATE === null || data.RATE === "" || Number(data.RATE) < 0) {
    res.status(400).json({ success: false, message: "A valid rate is required" });
    return;
  }

  try {
    const result = await savePurchaseQuotationAdditionalChargeService({
      ...data,
      USER: USER || "Admin",
      MAC_ADDRESS: MAC_ADDRESS || "WEB",
    });
    res.json({
      success: true,
      message: result.message || "Additional Charge saved successfully",
      PURCHASE_QUOTATION_ADDITIONAL_CHARGES_ID: result.id,
    });
  } catch (error: any) {
    console.error("SavePurchaseQuotationAdditionalCharge error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updatePurchaseQuotationAdditionalCharge = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const chargeId = toPositiveInt(id);

  if (!chargeId) {
    res.status(400).json({ success: false, message: "Valid additional charges id is required" });
    return;
  }

  const data: PurchaseQuotationAdditionalChargeData = req.body;
  const { USER, MAC_ADDRESS } = identityFrom(req);

  try {
    if (!data.PURCHASE_QUOTATION_NO) {
      res.status(400).json({ success: false, message: "Purchase Quotation no is required" });
      return;
    }

    const result = await updatePurchaseQuotationAdditionalChargeService({
      ...data,
      PURCHASE_QUOTATION_ADDITIONAL_CHARGES_ID: chargeId,
      USER: USER || "Admin",
      MAC_ADDRESS: MAC_ADDRESS || "WEB",
    });
    res.json({ success: true, message: result.message || "Additional Charge updated successfully" });
  } catch (error: any) {
    console.error("UpdatePurchaseQuotationAdditionalCharge error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deletePurchaseQuotationAdditionalCharge = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);
  const chargeId = toPositiveInt(id);

  if (!chargeId) {
    res.status(400).json({ success: false, message: "Valid additional charges id is required" });
    return;
  }

  try {
    const result = await deletePurchaseQuotationAdditionalChargeService(
      chargeId,
      USER || "Admin",
      ROLE || "Admin",
      MAC_ADDRESS || "WEB"
    );
    res.json({ success: true, message: result.message || "Additional Charge deleted successfully" });
  } catch (error: any) {
    console.error("DeletePurchaseQuotationAdditionalCharge error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};