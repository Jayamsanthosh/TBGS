import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllPaymentModeMasterService,
  getPaymentModeMasterByIdService,
  savePaymentModeMasterService,
  updatePaymentModeMasterService,
  deletePaymentModeMasterService,
  PaymentModeMasterData,
} from "../services/paymentModeMaster.services";

const parseId = (raw: unknown): number | null => {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const VALID_STATUSES = ["AC", "IA", "ACTIVE", "INACTIVE"];

export const getAllPaymentModeMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
    const paymentModes = await getAllPaymentModeMasterService(status);
    res.json({ success: true, count: paymentModes.length, data: paymentModes });
  } catch (error: any) {
    console.error("GetAllPaymentModeMaster error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPaymentModeMasterById = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);

  if (!id) {
    res.status(400).json({ success: false, message: "A valid Payment Mode ID is required" });
    return;
  }

  try {
    const rawLinkId = req.query.LINK_ID ?? req.query.link_id;
    const linkId = rawLinkId != null && rawLinkId !== "" ? Number(rawLinkId) : null;
    const paymentMode = await getPaymentModeMasterByIdService(id, Number.isFinite(linkId) ? linkId : null);

    if (!paymentMode) {
      res.status(404).json({ success: false, message: "Payment mode not found" });
      return;
    }

    res.json({ success: true, data: paymentMode });
  } catch (error: any) {
    console.error("GetPaymentModeMasterById error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const savePaymentModeMaster = async (req: Request, res: Response): Promise<void> => {
  const paymentModeData: PaymentModeMasterData = req.body;

  if (!paymentModeData.PAYMENT_MODE_NAME?.trim()) {
    res.status(400).json({ success: false, message: "Payment Mode Name is required" });
    return;
  }

  if (paymentModeData.STATUS_ENTRY && !VALID_STATUSES.includes(paymentModeData.STATUS_ENTRY.toUpperCase())) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  const { USER, MAC_ADDRESS } = identityFrom(req);
  paymentModeData.USER = USER || paymentModeData.USER || "Admin";
  paymentModeData.MAC_ADDRESS = MAC_ADDRESS || paymentModeData.MAC_ADDRESS || "WEB";
  if (paymentModeData.LINK_ID === undefined || paymentModeData.LINK_ID === null) {
    paymentModeData.LINK_ID = 43;
  }

  try {
    const result = await savePaymentModeMasterService(paymentModeData);
    res.json({
      success: true,
      message: result.message || "Data Saved Successfully",
      data: result.PAYMENT_MODE_ID,
      PAYMENT_MODE_ID: result.PAYMENT_MODE_ID,
    });
  } catch (error: any) {
    console.error("SavePaymentModeMaster error:", error);
    res.status(error?.httpStatus || 400).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updatePaymentModeMaster = async (req: Request, res: Response): Promise<void> => {
  const paymentModeData: PaymentModeMasterData = req.body;
  const id = parseId(req.params.id) ?? parseId(paymentModeData.PAYMENT_MODE_ID);

  if (!id) {
    res.status(400).json({ success: false, message: "A valid Payment Mode ID is required" });
    return;
  }

  if (!paymentModeData.PAYMENT_MODE_NAME?.trim()) {
    res.status(400).json({ success: false, message: "Payment Mode Name is required" });
    return;
  }

  if (paymentModeData.STATUS_ENTRY && !VALID_STATUSES.includes(paymentModeData.STATUS_ENTRY.toUpperCase())) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  paymentModeData.PAYMENT_MODE_ID = id;
  const { USER, MAC_ADDRESS } = identityFrom(req);
  paymentModeData.USER = USER || paymentModeData.USER || "Admin";
  paymentModeData.MAC_ADDRESS = MAC_ADDRESS || paymentModeData.MAC_ADDRESS || "WEB";
  if (paymentModeData.LINK_ID === undefined || paymentModeData.LINK_ID === null) {
    paymentModeData.LINK_ID = 43;
  }

  try {
    const result = await updatePaymentModeMasterService(paymentModeData);
    res.json({
      success: true,
      message: result.message || "RECORD UPDATED SUCCESSFULL",
      data: result.PAYMENT_MODE_ID,
      PAYMENT_MODE_ID: result.PAYMENT_MODE_ID,
    });
  } catch (error: any) {
    console.error("UpdatePaymentModeMaster error:", error);
    res.status(error?.httpStatus || 400).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deletePaymentModeMaster = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "A valid Payment Mode ID is required" });
    return;
  }

  try {
    const result = await deletePaymentModeMasterService(
      id,
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeletePaymentModeMaster error:", error);
    res.status(error?.httpStatus || 400).json({ success: false, message: error?.message || "Internal server error" });
  }
};
