import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllPaymentTermMasterService,
  getPaymentTermMasterByIdService,
  savePaymentTermMasterService,
  updatePaymentTermMasterService,
  deletePaymentTermMasterService,
  PaymentTermMasterData,
} from "../services/paymentTermMaster.services";

const parseId = (raw: unknown): number | null => {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
};

export const getAllPaymentTermMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
    const paymentTerms = await getAllPaymentTermMasterService(status);
    res.json({ success: true, count: paymentTerms.length, data: paymentTerms });
  } catch (error: any) {
    console.error("GetAllPaymentTermMaster error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPaymentTermMasterById = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);

  if (!id) {
    res.status(400).json({ success: false, message: "A valid Payment Term ID is required" });
    return;
  }

  try {
    const rawLinkId = req.query.LINK_ID ?? req.query.link_id;
    const linkId = rawLinkId != null && rawLinkId !== "" ? Number(rawLinkId) : null;
    const paymentTerm = await getPaymentTermMasterByIdService(id, Number.isFinite(linkId) ? linkId : null);

    if (!paymentTerm) {
      res.status(404).json({ success: false, message: "Payment term not found" });
      return;
    }

    res.json({ success: true, data: paymentTerm });
  } catch (error: any) {
    console.error("GetPaymentTermMasterById error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const savePaymentTermMaster = async (req: Request, res: Response): Promise<void> => {
  const paymentTermData: PaymentTermMasterData = req.body;

  if (!paymentTermData.PAYMENT_TERM_CODE?.trim()) {
    res.status(400).json({ success: false, message: "Payment Term Code is required" });
    return;
  }

  if (!paymentTermData.PAYMENT_TERM_NAME?.trim()) {
    res.status(400).json({ success: false, message: "Payment Term Name is required" });
    return;
  }

  const { USER, MAC_ADDRESS } = identityFrom(req);
  paymentTermData.USER = USER || paymentTermData.USER || "Admin";
  paymentTermData.MAC_ADDRESS = MAC_ADDRESS || paymentTermData.MAC_ADDRESS || "WEB";
  if (paymentTermData.LINK_ID === undefined || paymentTermData.LINK_ID === null) {
    paymentTermData.LINK_ID = 101;
  }

  try {
    const result = await savePaymentTermMasterService(paymentTermData);
    res.json({
      success: true,
      message: result.message || "DATA SAVED SUCCESSFULLY",
      data: result.PAYMENT_TERM_ID,
      PAYMENT_TERM_ID: result.PAYMENT_TERM_ID,
    });
  } catch (error: any) {
    console.error("SavePaymentTermMaster error:", error);
    res.status(error?.httpStatus || 400).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updatePaymentTermMaster = async (req: Request, res: Response): Promise<void> => {
  const paymentTermData: PaymentTermMasterData = req.body;
  const id = parseId(req.params.id) ?? parseId(paymentTermData.PAYMENT_TERM_ID);

  if (!id) {
    res.status(400).json({ success: false, message: "A valid Payment Term ID is required" });
    return;
  }

  if (!paymentTermData.PAYMENT_TERM_CODE?.trim()) {
    res.status(400).json({ success: false, message: "Payment Term Code is required" });
    return;
  }

  if (!paymentTermData.PAYMENT_TERM_NAME?.trim()) {
    res.status(400).json({ success: false, message: "Payment Term Name is required" });
    return;
  }

  paymentTermData.PAYMENT_TERM_ID = id;
  const { USER, MAC_ADDRESS } = identityFrom(req);
  paymentTermData.USER = USER || paymentTermData.USER || "Admin";
  paymentTermData.MAC_ADDRESS = MAC_ADDRESS || paymentTermData.MAC_ADDRESS || "WEB";
  if (paymentTermData.LINK_ID === undefined || paymentTermData.LINK_ID === null) {
    paymentTermData.LINK_ID = 101;
  }

  try {
    const result = await updatePaymentTermMasterService(paymentTermData);
    res.json({
      success: true,
      message: result.message || "RECORD UPDATED SUCCESSFULLY",
      data: result.PAYMENT_TERM_ID,
      PAYMENT_TERM_ID: result.PAYMENT_TERM_ID,
    });
  } catch (error: any) {
    console.error("UpdatePaymentTermMaster error:", error);
    res.status(error?.httpStatus || 400).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deletePaymentTermMaster = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "A valid Payment Term ID is required" });
    return;
  }

  try {
    const result = await deletePaymentTermMasterService(
      id,
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeletePaymentTermMaster error:", error);
    res.status(error?.httpStatus || 400).json({ success: false, message: error?.message || "Internal server error" });
  }
};
