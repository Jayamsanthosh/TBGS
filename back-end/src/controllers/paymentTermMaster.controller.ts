import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllPaymentTermMasterService,
  getPaymentTermMasterByIdService,
  savePaymentTermMasterService,
  updatePaymentTermMasterService,
  deletePaymentTermMasterService,
  PaymentTermMasterData
} from "../services/paymentTermMaster.services";

export const getAllPaymentTermMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
    const paymentTerms = await getAllPaymentTermMasterService(status);
    res.json({ success: true, count: paymentTerms.length, data: paymentTerms });
  } catch (error: any) {
    console.error("GetAllPaymentTermMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPaymentTermMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Payment Term ID is required" });
    return;
  }

  try {
    const paymentTerm = await getPaymentTermMasterByIdService(parseInt(id as string, 10));

    if (!paymentTerm) {
      res.status(404).json({ success: false, message: "Payment term not found" });
      return;
    }

    res.json({ success: true, data: paymentTerm });
  } catch (error: any) {
    console.error("GetPaymentTermMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const savePaymentTermMaster = async (req: Request, res: Response): Promise<void> => {
  const paymentTermData: PaymentTermMasterData = req.body;

  if (!paymentTermData.PAYMENT_TERM_CODE || !paymentTermData.PAYMENT_TERM_NAME) {
    res.status(400).json({ success: false, message: "Payment Term Code and Name are required" });
    return;
  }

  try {
    const result = await savePaymentTermMasterService(paymentTermData);
    res.json({ success: true, message: result.message || "Data saved successfully", PAYMENT_TERM_ID: result.PAYMENT_TERM_ID });
  } catch (error: any) {
    console.error("SavePaymentTermMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updatePaymentTermMaster = async (req: Request, res: Response): Promise<void> => {
  const paymentTermData: PaymentTermMasterData = req.body;
  const { id } = req.params;

  try {
    if (!paymentTermData.PAYMENT_TERM_ID && id) {
      paymentTermData.PAYMENT_TERM_ID = parseInt(id as string, 10);
    }

    const result = await updatePaymentTermMasterService(paymentTermData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdatePaymentTermMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deletePaymentTermMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Payment Term ID is required" });
    return;
  }

  try {
    const result = await deletePaymentTermMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeletePaymentTermMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
