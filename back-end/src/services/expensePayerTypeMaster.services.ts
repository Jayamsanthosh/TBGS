import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface ExpensePayerTypeMasterData {
  PAID_BY_ID?: number;
  PAID_BY_NAME: string;
  PAID_BY_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllExpensePayerTypeMasterService = async (status = "ALL") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    if (status === "ALL") {
      const statuses = ["AC", "IA"];
      let allRows: any[] = [];
      for (const s of statuses) {
        const result = await pool
          .request()
          .input("STATUS", sql.VarChar(50), s)
          .execute("VMaster.SHOW_EXPENSE_PAYER_TYPE_MASTER");
        allRows = allRows.concat(result.recordset || []);
      }
      return allRows;
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(50), status)
      .execute("VMaster.SHOW_EXPENSE_PAYER_TYPE_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_EXPENSE_PAYER_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const getExpensePayerTypeMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PAID_BY_ID", sql.Int, id)
      .execute("VMaster.GET_EXPENSE_PAYER_TYPE_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_EXPENSE_PAYER_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const saveExpensePayerTypeMasterService = async (data: ExpensePayerTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PAID_BY_ID", sql.Int, data.PAID_BY_ID ?? 0)
      .input("PAID_BY_NAME", sql.VarChar(50), data.PAID_BY_NAME || null)
      .input("PAID_BY_DESCRIPTION", sql.VarChar(50), data.PAID_BY_DESCRIPTION || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_EXPENSE_PAYER_TYPE_MASTER");

    const { message, data: id } = parseSprocResult(result.recordset?.[0], "Failed to save expense payer type");
    return { message: message || "Data saved successfully", PAID_BY_ID: id };
  } catch (error) {
    console.error("SAVE_EXPENSE_PAYER_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const updateExpensePayerTypeMasterService = async (data: ExpensePayerTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PAID_BY_ID", sql.Int, data.PAID_BY_ID ?? 0)
      .input("PAID_BY_NAME", sql.VarChar(50), data.PAID_BY_NAME ?? null)
      .input("PAID_BY_DESCRIPTION", sql.VarChar(50), data.PAID_BY_DESCRIPTION ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_EXPENSE_PAYER_TYPE_MASTER");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to update expense payer type");
    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_EXPENSE_PAYER_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const deleteExpensePayerTypeMasterService = async (
  id: number,
  user: string,
  role: string,
  macAddress: string
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PAID_BY_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_EXPENSE_PAYER_TYPE_MASTER");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to delete expense payer type");
    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_EXPENSE_PAYER_TYPE_MASTER SP error:", error);
    throw error;
  }
};