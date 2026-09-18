import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllPaymentModeMasterService,
  getPaymentModeMasterByIdService,
  savePaymentModeMasterService,
  updatePaymentModeMasterService,
  deletePaymentModeMasterService,
  PaymentModeMasterData
} from "../services/paymentModeMaster.services";

export const getAllPaymentModeMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const paymentModes = await getAllPaymentModeMasterService(status || undefined);
    res.json({ success: true, count: paymentModes.length, data: paymentModes });
  } catch (error: any) {
    console.error("GetAllPaymentModeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPaymentModeMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Payment Mode ID is required" });
    return;
  }

  try {
    const paymentMode = await getPaymentModeMasterByIdService(parseInt(id as string, 10));

    if (!paymentMode) {
      res.status(404).json({ success: false, message: "Payment mode not found" });
      return;
    }

    res.json({ success: true, data: paymentMode });
  } catch (error: any) {
    console.error("GetPaymentModeMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

const VALID_STATUSES = ["AC", "IA"];

export const savePaymentModeMaster = async (req: Request, res: Response): Promise<void> => {
  const paymentModeData: PaymentModeMasterData = req.body;

  if (!paymentModeData.PAYMENT_MODE_NAME?.trim()) {
    res.status(400).json({ success: false, message: "Payment Mode Name is required" });
    return;
  }

  if (paymentModeData.STATUS_ENTRY && !VALID_STATUSES.includes(paymentModeData.STATUS_ENTRY)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    const result = await savePaymentModeMasterService(paymentModeData);
    res.json({ success: true, message: result.message || "Data saved successfully", PAYMENT_MODE_ID: result.PAYMENT_MODE_ID });
  } catch (error: any) {
    console.error("SavePaymentModeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updatePaymentModeMaster = async (req: Request, res: Response): Promise<void> => {
  const paymentModeData: PaymentModeMasterData = req.body;
  const { id } = req.params;

  if (paymentModeData.STATUS_ENTRY && !VALID_STATUSES.includes(paymentModeData.STATUS_ENTRY)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    if (!paymentModeData.PAYMENT_MODE_ID && id) {
      paymentModeData.PAYMENT_MODE_ID = parseInt(id as string, 10);
    }

    const result = await updatePaymentModeMasterService(paymentModeData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdatePaymentModeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deletePaymentModeMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Payment Mode ID is required" });
    return;
  }

  try {
    const result = await deletePaymentModeMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeletePaymentModeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
