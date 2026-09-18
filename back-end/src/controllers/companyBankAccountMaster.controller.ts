import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllCompanyBankAccountMasterService,
  getCompanyBankAccountMasterByIdService,
  saveCompanyBankAccountMasterService,
  updateCompanyBankAccountMasterService,
  deleteCompanyBankAccountMasterService,
  type CompanyBankAccountData,
} from "../services/companyBankAccountMaster.services";

export const getAllCompanyBankAccountMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const accounts = await getAllCompanyBankAccountMasterService(status || undefined);
    res.json({ success: true, count: accounts.length, data: accounts });
  } catch (error: any) {
    console.error("GetAllCompanyBankAccountMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getCompanyBankAccountMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "ACCOUNT ID is required" });
    return;
  }

  try {
    const account = await getCompanyBankAccountMasterByIdService(parseInt(id as string, 10));

    if (!account) {
      res.status(404).json({ success: false, message: "Account not found" });
      return;
    }

    res.json({ success: true, data: account });
  } catch (error: any) {
    console.error("GetCompanyBankAccountMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

const VALID_STATUSES = ["AC", "IA"];

export const saveCompanyBankAccountMaster = async (req: Request, res: Response): Promise<void> => {
  const accountData: CompanyBankAccountData = req.body;

  if (!accountData.ACCOUNT_NAME?.trim()) {
    res.status(400).json({ success: false, message: "Account Name is required" });
    return;
  }

  if (!accountData.ACCOUNT_NUMBER?.trim()) {
    res.status(400).json({ success: false, message: "Account Number is required" });
    return;
  }

  if (accountData.STATUS_MASTER && !VALID_STATUSES.includes(accountData.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    const result = await saveCompanyBankAccountMasterService(accountData);
    res.json({ success: true, message: result.message || "Data saved successfully", ACCOUNT_ID: result.ACCOUNT_ID });
  } catch (error: any) {
    console.error("SaveCompanyBankAccountMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateCompanyBankAccountMaster = async (req: Request, res: Response): Promise<void> => {
  const accountData: CompanyBankAccountData = req.body;
  const { id } = req.params;

  if (accountData.STATUS_MASTER && !VALID_STATUSES.includes(accountData.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    if (!accountData.ACCOUNT_ID && id) {
      accountData.ACCOUNT_ID = parseInt(id as string, 10);
    }

    const result = await updateCompanyBankAccountMasterService(accountData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateCompanyBankAccountMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteCompanyBankAccountMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "ACCOUNT ID is required" });
    return;
  }

  try {
    const result = await deleteCompanyBankAccountMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Data deleted successfully" });
  } catch (error: any) {
    console.error("DeleteCompanyBankAccountMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
