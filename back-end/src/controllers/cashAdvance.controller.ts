import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllCashAdvancesService,
  getCashAdvanceByIdService,
  saveCashAdvanceService,
  updateCashAdvanceService,
  deleteCashAdvanceService,
  CashAdvanceData
} from "../services/cashAdvance.services";
import { getAllowedCompanyIds } from "../services/auth.services";

export const getAllCashAdvances = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
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
    const cashAdvances = await getAllCashAdvancesService(status, allowedCompanyIds);
    res.json({ success: true, count: cashAdvances.length, data: cashAdvances });
  } catch (error: any) {
    console.error("GetAllCashAdvances error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getCashAdvanceById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "SNO is required" });
    return;
  }

  try {
    const cashAdvance = await getCashAdvanceByIdService(parseInt(id as string, 10));

    if (!cashAdvance) {
      res.status(404).json({ success: false, message: "Cash advance not found" });
      return;
    }

    res.json({ success: true, data: cashAdvance });
  } catch (error: any) {
    console.error("GetCashAdvanceById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveCashAdvance = async (req: Request, res: Response): Promise<void> => {
  const cashAdvanceData: CashAdvanceData = req.body;

  if (!cashAdvanceData.CASH_ADV_REQUEST_REF_NO) {
    res.status(400).json({ success: false, message: "Cash Advance Request Ref No is required" });
    return;
  }

  try {
    const result = await saveCashAdvanceService(cashAdvanceData);
    res.json({
      success: true,
      message: result.message || "Data saved successfully",
      SNO: result.SNO,
    });
  } catch (error: any) {
    console.error("SaveCashAdvance error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateCashAdvance = async (req: Request, res: Response): Promise<void> => {
  const cashAdvanceData: CashAdvanceData = req.body;
  const { id } = req.params;

  try {
    if (!cashAdvanceData.SNO && id) {
      cashAdvanceData.SNO = parseInt(id as string, 10);
    }

    const result = await updateCashAdvanceService(cashAdvanceData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateCashAdvance error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteCashAdvance = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "SNO is required" });
    return;
  }

  try {
    const result = await deleteCashAdvanceService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteCashAdvance error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};