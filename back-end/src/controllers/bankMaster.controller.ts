import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllBankMasterService,
  getBankMasterByIdService,
  saveBankMasterService,
  updateBankMasterService,
  deleteBankMasterService,
  type BankMasterData,
} from "../services/bankMaster.services";

export const getAllBankMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const banks = await getAllBankMasterService(status || undefined);
    res.json({ success: true, count: banks.length, data: banks });
  } catch (error: any) {
    console.error("GetAllBankMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getBankMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "BANK ID is required" });
    return;
  }

  try {
    const bank = await getBankMasterByIdService(parseInt(id as string, 10));

    if (!bank) {
      res.status(404).json({ success: false, message: "Bank not found" });
      return;
    }

    res.json({ success: true, data: bank });
  } catch (error: any) {
    console.error("GetBankMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

const VALID_STATUSES = ["AC", "IA"];

export const saveBankMaster = async (req: Request, res: Response): Promise<void> => {
  const bankData: BankMasterData = req.body;

  if (!bankData.BANK_NAME?.trim()) {
    res.status(400).json({ success: false, message: "Bank Name is required" });
    return;
  }

  if (bankData.STATUS_MASTER && !VALID_STATUSES.includes(bankData.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    const result = await saveBankMasterService(bankData);
    res.json({ success: true, message: result.message || "Data saved successfully", BANK_ID: result.BANK_ID });
  } catch (error: any) {
    console.error("SaveBankMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateBankMaster = async (req: Request, res: Response): Promise<void> => {
  const bankData: BankMasterData = req.body;
  const { id } = req.params;

  if (bankData.STATUS_MASTER && !VALID_STATUSES.includes(bankData.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    if (!bankData.BANK_ID && id) {
      bankData.BANK_ID = parseInt(id as string, 10);
    }

    const result = await updateBankMasterService(bankData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateBankMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteBankMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "BANK ID is required" });
    return;
  }

  try {
    const result = await deleteBankMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Data deleted successfully" });
  } catch (error: any) {
    console.error("DeleteBankMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
