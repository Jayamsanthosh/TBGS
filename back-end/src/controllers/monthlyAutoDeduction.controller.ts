import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllMonthlyAutoDeductionsService,
  getMonthlyAutoDeductionByIdService,
  saveMonthlyAutoDeductionService,
  updateMonthlyAutoDeductionService,
  deleteMonthlyAutoDeductionService,
  MonthlyAutoDeductionData,
} from "../services/monthlyAutoDeduction.services";
import { getAllowedCompanyIds } from "../services/auth.services";

export const getAllMonthlyAutoDeductions = async (req: Request, res: Response): Promise<void> => {
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
    const deductions = await getAllMonthlyAutoDeductionsService(status, allowedCompanyIds);
    res.json({ success: true, count: deductions.length, data: deductions });
  } catch (error: any) {
    console.error("GetAllMonthlyAutoDeductions error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getMonthlyAutoDeductionById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "M_AUTO_REF_NO is required" });
    return;
  }

  try {
    const deduction = await getMonthlyAutoDeductionByIdService(parseInt(id as string, 10));

    if (!deduction) {
      res.status(404).json({ success: false, message: "Monthly auto deduction not found" });
      return;
    }

    res.json({ success: true, data: deduction });
  } catch (error: any) {
    console.error("GetMonthlyAutoDeductionById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveMonthlyAutoDeduction = async (req: Request, res: Response): Promise<void> => {
  const deductionData: MonthlyAutoDeductionData = req.body;

  try {
    const result = await saveMonthlyAutoDeductionService(deductionData);
    res.json({
      success: true,
      message: result.message || "Data saved successfully",
      M_AUTO_REF_NO: result.M_AUTO_REF_NO,
    });
  } catch (error: any) {
    console.error("SaveMonthlyAutoDeduction error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateMonthlyAutoDeduction = async (req: Request, res: Response): Promise<void> => {
  const deductionData: MonthlyAutoDeductionData = req.body;
  const { id } = req.params;

  try {
    if (!deductionData.M_AUTO_REF_NO && id) {
      deductionData.M_AUTO_REF_NO = parseInt(id as string, 10);
    }

    const result = await updateMonthlyAutoDeductionService(deductionData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateMonthlyAutoDeduction error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteMonthlyAutoDeduction = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "M_AUTO_REF_NO is required" });
    return;
  }

  try {
    const result = await deleteMonthlyAutoDeductionService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteMonthlyAutoDeduction error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
