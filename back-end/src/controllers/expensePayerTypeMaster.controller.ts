import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  getAllExpensePayerTypeMasterService,
  getExpensePayerTypeMasterByIdService,
  saveExpensePayerTypeMasterService,
  updateExpensePayerTypeMasterService,
  deleteExpensePayerTypeMasterService,
  ExpensePayerTypeMasterData
} from "../services/expensePayerTypeMaster.services";

export const getAllExpensePayerTypeMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
    const expensePayerTypes = await getAllExpensePayerTypeMasterService(status);
    res.json({ success: true, count: expensePayerTypes.length, data: expensePayerTypes });
  } catch (error: any) {
    console.error("GetAllExpensePayerTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getExpensePayerTypeMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Paid By ID is required" });
    return;
  }

  try {
    const expensePayerType = await getExpensePayerTypeMasterByIdService(parseInt(id as string, 10));

    if (!expensePayerType) {
      res.status(404).json({ success: false, message: "Expense Payer Type not found" });
      return;
    }

    res.json({ success: true, data: expensePayerType });
  } catch (error: any) {
    console.error("GetExpensePayerTypeMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveExpensePayerTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const expensePayerTypeData: ExpensePayerTypeMasterData = req.body;

  if (!expensePayerTypeData.PAID_BY_NAME) {
    res.status(400).json({ success: false, message: "Paid By Name is required" });
    return;
  }

  try {
    const result = await saveExpensePayerTypeMasterService(expensePayerTypeData);
    res.json({ success: true, message: result.message || "Data saved successfully", PAID_BY_ID: result.PAID_BY_ID });
  } catch (error: any) {
    console.error("SaveExpensePayerTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateExpensePayerTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const expensePayerTypeData: ExpensePayerTypeMasterData = req.body;
  const { id } = req.params;

  try {
    if (!expensePayerTypeData.PAID_BY_ID && id) {
      expensePayerTypeData.PAID_BY_ID = parseInt(id as string, 10);
    }

    const result = await updateExpensePayerTypeMasterService(expensePayerTypeData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateExpensePayerTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteExpensePayerTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Paid By ID is required" });
    return;
  }

  try {
    const result = await deleteExpensePayerTypeMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteExpensePayerTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};