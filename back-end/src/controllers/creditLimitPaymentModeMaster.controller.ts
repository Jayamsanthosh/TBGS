import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllCreditLimitPaymentModeMasterService,
  getCreditLimitPaymentModeMasterByIdService,
  saveCreditLimitPaymentModeMasterService,
  updateCreditLimitPaymentModeMasterService,
  deleteCreditLimitPaymentModeMasterService,
  CreditLimitPaymentModeMasterData
} from "../services/creditLimitPaymentModeMaster.services";

export const getAllCreditLimitPaymentModeMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const modes = await getAllCreditLimitPaymentModeMasterService(status);
    res.json({ success: true, count: modes.length, data: modes });
  } catch (error: any) {
    console.error("GetAllCreditLimitPaymentModeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getCreditLimitPaymentModeMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ success: false, message: "Payment Mode ID is required" });
    return;
  }
  try {
    const mode = await getCreditLimitPaymentModeMasterByIdService(parseInt(id as string, 10));
    if (!mode) {
      res.status(404).json({ success: false, message: "Payment mode not found" });
      return;
    }
    res.json({ success: true, data: mode });
  } catch (error: any) {
    console.error("GetCreditLimitPaymentModeMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveCreditLimitPaymentModeMaster = async (req: Request, res: Response): Promise<void> => {
  const modeData: CreditLimitPaymentModeMasterData = req.body;
  if (!modeData.PAYMENT_MODE_NAME) {
    res.status(400).json({ success: false, message: "Payment Mode Name is required" });
    return;
  }
  try {
    const result = await saveCreditLimitPaymentModeMasterService(modeData);
    res.json({ success: true, message: result.message || "Credit limit payment mode saved successfully" });
  } catch (error: any) {
    console.error("SaveCreditLimitPaymentModeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateCreditLimitPaymentModeMaster = async (req: Request, res: Response): Promise<void> => {
  const modeData: CreditLimitPaymentModeMasterData = req.body;
  const { id } = req.params;
  try {
    if (!modeData.PAYMENT_MODE_ID && id) {
      modeData.PAYMENT_MODE_ID = parseInt(id as string, 10);
    }
    const result = await updateCreditLimitPaymentModeMasterService(modeData);
    res.json({ success: true, message: result.message || "Credit limit payment mode updated successfully" });
  } catch (error: any) {
    console.error("UpdateCreditLimitPaymentModeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteCreditLimitPaymentModeMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);
  if (!id) {
    res.status(400).json({ success: false, message: "Payment Mode ID is required" });
    return;
  }
  try {
    const result = await deleteCreditLimitPaymentModeMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Credit limit payment mode deleted successfully" });
  } catch (error: any) {
    console.error("DeleteCreditLimitPaymentModeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
