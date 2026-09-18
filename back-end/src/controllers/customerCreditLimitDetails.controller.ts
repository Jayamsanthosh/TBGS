import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllCustomerCreditLimitDetailsService,
  getCustomerCreditLimitDetailsByIdService,
  saveCustomerCreditLimitDetailsService,
  updateCustomerCreditLimitDetailsService,
  deleteCustomerCreditLimitDetailsService,
  CustomerCreditLimitDetailsData
} from "../services/customerCreditLimitDetails.services";

const VALID_STATUSES = ["AC", "IN"];

export const getAllCustomerCreditLimitDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyIdRaw = String(req.query.companyId ?? "").trim();
    const companyId = /^\d+$/.test(companyIdRaw) ? parseInt(companyIdRaw, 10) : 0;
    const status = (req.query.status as string) || "ALL";

    const items = await getAllCustomerCreditLimitDetailsService(companyId, status);
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllCustomerCreditLimitDetails error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getCustomerCreditLimitDetailsById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "SNO is required" });
    return;
  }

  try {
    const item = await getCustomerCreditLimitDetailsByIdService(parseInt(id as string, 10));

    if (!item) {
      res.status(404).json({ success: false, message: "Customer credit limit details not found" });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetCustomerCreditLimitDetailsById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveCustomerCreditLimitDetails = async (req: Request, res: Response): Promise<void> => {
  const data: CustomerCreditLimitDetailsData = req.body;

  if (!data.COMPANY_ID) {
    res.status(400).json({ success: false, message: "Company is required" });
    return;
  }
  if (!data.BP_ID) {
    res.status(400).json({ success: false, message: "Business partner is required" });
    return;
  }
  if (!data.PAYMENT_MODE_ID) {
    res.status(400).json({ success: false, message: "Payment mode is required" });
    return;
  }
  if (!data.CURRENCY_ID) {
    res.status(400).json({ success: false, message: "Currency is required" });
    return;
  }
  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IN" });
    return;
  }

  try {
    const result = await saveCustomerCreditLimitDetailsService(data);
    res.json({ success: true, message: result.message || "Data saved successfully", SNO: result.SNO });
  } catch (error: any) {
    console.error("SaveCustomerCreditLimitDetails error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateCustomerCreditLimitDetails = async (req: Request, res: Response): Promise<void> => {
  const data: CustomerCreditLimitDetailsData = req.body;
  const { id } = req.params;

  if (!data.COMPANY_ID) {
    res.status(400).json({ success: false, message: "Company is required" });
    return;
  }
  if (!data.BP_ID) {
    res.status(400).json({ success: false, message: "Business partner is required" });
    return;
  }
  if (!data.PAYMENT_MODE_ID) {
    res.status(400).json({ success: false, message: "Payment mode is required" });
    return;
  }
  if (!data.CURRENCY_ID) {
    res.status(400).json({ success: false, message: "Currency is required" });
    return;
  }
  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IN" });
    return;
  }

  try {
    if (!data.SNO && id) {
      data.SNO = parseInt(id as string, 10);
    }

    const result = await updateCustomerCreditLimitDetailsService(data);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateCustomerCreditLimitDetails error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteCustomerCreditLimitDetails = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "SNO is required" });
    return;
  }

  try {
    const result = await deleteCustomerCreditLimitDetailsService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteCustomerCreditLimitDetails error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
