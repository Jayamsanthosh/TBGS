import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  getPurchaseOrderAdditionalChargesService,
  getPurchaseOrderAdditionalChargeService,
  savePurchaseOrderAdditionalChargeService,
  updatePurchaseOrderAdditionalChargeService,
  deletePurchaseOrderAdditionalChargeService,
  PurchaseOrderAdditionalChargeData
} from "../services/purchaseOrderAdditionalCharge.services";

const toPositiveInt = (v: any): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
};

export const getPurchaseOrderAdditionalCharges = async (req: Request, res: Response): Promise<void> => {
  const { refNo } = req.params;

  if (!refNo) {
    res.status(400).json({ success: false, message: "Purchase Order no is required" });
    return;
  }

  try {
    const data = await getPurchaseOrderAdditionalChargesService(refNo as string);
    res.json({ success: true, count: data.length, data });
  } catch (error: any) {
    console.error("GetPurchaseOrderAdditionalCharges error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPurchaseOrderAdditionalCharge = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const chargeId = toPositiveInt(id);

  if (!chargeId) {
    res.status(400).json({ success: false, message: "Valid additional charges id is required" });
    return;
  }

  try {
    const data = await getPurchaseOrderAdditionalChargeService(chargeId);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("GetPurchaseOrderAdditionalCharge error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const savePurchaseOrderAdditionalCharge = async (req: Request, res: Response): Promise<void> => {
  const data: PurchaseOrderAdditionalChargeData = req.body;
  const { USER, MAC_ADDRESS } = identityFrom(req);

  if (!data.PURCHASE_ORDER_NO) {
    res.status(400).json({ success: false, message: "Purchase Order no is required" });
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
    const result = await savePurchaseOrderAdditionalChargeService({
      ...data,
      USER: USER || "Admin",
      MAC_ADDRESS: MAC_ADDRESS || "WEB",
    });
    res.json({
      success: true,
      message: result.message || "Additional Charge saved successfully",
      PURCHASE_ORDER_ADDITIONAL_CHARGES_ID: result.id,
    });
  } catch (error: any) {
    console.error("SavePurchaseOrderAdditionalCharge error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updatePurchaseOrderAdditionalCharge = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const chargeId = toPositiveInt(id);

  if (!chargeId) {
    res.status(400).json({ success: false, message: "Valid additional charges id is required" });
    return;
  }

  const data: PurchaseOrderAdditionalChargeData = req.body;
  const { USER, MAC_ADDRESS } = identityFrom(req);

  try {
    if (!data.PURCHASE_ORDER_NO) {
      res.status(400).json({ success: false, message: "Purchase Order no is required" });
      return;
    }

    const result = await updatePurchaseOrderAdditionalChargeService({
      ...data,
      PURCHASE_ORDER_ADDITIONAL_CHARGES_ID: chargeId,
      USER: USER || "Admin",
      MAC_ADDRESS: MAC_ADDRESS || "WEB",
    });
    res.json({ success: true, message: result.message || "Additional Charge updated successfully" });
  } catch (error: any) {
    console.error("UpdatePurchaseOrderAdditionalCharge error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deletePurchaseOrderAdditionalCharge = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);
  const chargeId = toPositiveInt(id);

  if (!chargeId) {
    res.status(400).json({ success: false, message: "Valid additional charges id is required" });
    return;
  }

  try {
    const result = await deletePurchaseOrderAdditionalChargeService(
      chargeId,
      USER || "Admin",
      ROLE || "Admin",
      MAC_ADDRESS || "WEB"
    );
    res.json({ success: true, message: result.message || "Additional Charge deleted successfully" });
  } catch (error: any) {
    console.error("DeletePurchaseOrderAdditionalCharge error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};