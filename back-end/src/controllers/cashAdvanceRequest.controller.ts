import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllCashAdvanceRequestsService,
  getCashAdvanceRequestByIdService,
  saveCashAdvanceRequestService,
  updateCashAdvanceRequestService,
  deleteCashAdvanceRequestService,
  submitCashAdvanceRequestService,
  type CashAdvanceRequestData,
} from "../services/cashAdvanceRequest.services";
import { getAllowedCompanyIds } from "../services/auth.services";

const VALID_STATUSES = ["AC", "IN"];

export const getAllCashAdvanceRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
    const pendingOnly =
      req.query.pendingOnly === "1" || req.query.pendingOnly === "true" || req.query.pendingOnly === "yes";
    const isAdmin = req.user?.role === "Admin" || req.user?.role === "Super Admin";
    let allowedCompanyIds: number[] | undefined;
    if (!isAdmin) {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }
      allowedCompanyIds = await getAllowedCompanyIds(req.user.sub);
      if (allowedCompanyIds.length === 0) {
        res.json({ success: true, count: 0, data: [] });
        return;
      }
    }
    const items = await getAllCashAdvanceRequestsService(status, allowedCompanyIds, pendingOnly);
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllCashAdvanceRequest error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getCashAdvanceRequestById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Ref no is required" });
    return;
  }

  try {
    const item = await getCashAdvanceRequestByIdService(String(id));

    if (!item) {
      res.status(404).json({ success: false, message: "Cash advance request not found" });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetCashAdvanceRequestById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveCashAdvanceRequest = async (req: Request, res: Response): Promise<void> => {
  const data: CashAdvanceRequestData = req.body;

  if (!data.EMP_ID) {
    res.status(400).json({ success: false, message: "Employee is required" });
    return;
  }
  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IN" });
    return;
  }

  try {
    const result = await saveCashAdvanceRequestService(data);
    res.json({ success: true, message: result.message || "Data saved successfully", SNO: result.SNO });
  } catch (error: any) {
    console.error("SaveCashAdvanceRequest error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateCashAdvanceRequest = async (req: Request, res: Response): Promise<void> => {
  const data: CashAdvanceRequestData = req.body;
  const { id } = req.params;

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IN" });
    return;
  }

  try {
    if (!data.SNO && id) {
      data.SNO = parseInt(String(id), 10);
    }

    const result = await updateCashAdvanceRequestService(data);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateCashAdvanceRequest error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteCashAdvanceRequest = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Ref no is required" });
    return;
  }

  try {
    const result = await deleteCashAdvanceRequestService(
      String(id),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteCashAdvanceRequest error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const submitCashAdvanceRequest = async (req: Request, res: Response): Promise<void> => {
  const refNo = String(req.params.id || "");
  const { ROLE } = identityFrom(req);

  if (!refNo) {
    res.status(400).json({ success: false, message: "Ref no is required" });
    return;
  }

  try {
    const result = await submitCashAdvanceRequestService(refNo, ROLE || "Administrator");
    res.json({ success: true, message: result.message, STATUS_MASTER: result.STATUS_MASTER });
  } catch (error: any) {
    console.error("SubmitCashAdvanceRequest error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};