import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface PayrollDeductionTypeMasterData {
  DEDUCTION_TYPE_ID?: number;
  SALARY_DEDUCTION_TYPE?: string;
  DEDUCTION_TYPE_NAME?: string;
  DEDUCTION_TYPE_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  ROLE?: string;
  MAC_ADDRESS?: string;
}

/**
 * SPs return errors in two shapes:
 *   1) SELECT 'error', 'message', ''            (no column aliases)
 *   2) SELECT 'error' AS STATUS, ... AS MESSAGE  (aliased)
 * This helper detects either shape from the first row.
 */
const extractError = (row: any): string | null => {
  if (!row) return null;

  if (row.STATUS === "error" || row.STATUS === "ERROR") {
    return row.MESSAGE || "Operation failed";
  }

  const emptyKey = row[""];
  if (Array.isArray(emptyKey)) {
    const first = String(emptyKey[0] ?? "").toLowerCase();
    if (first === "error") {
      return String(emptyKey[1] ?? "Operation failed");
    }
  }

  const values = Object.values(row);
  if (values[0] === "error" || values[0] === "ERROR") {
    return String(values[1] ?? "Operation failed");
  }

  return null;
};

const serializeRecordset = (rows: any[]) =>
  (rows || []).map((r: any) => ({ ...r, id: r.DEDUCTION_TYPE_ID }));

export const getAllPayrollDeductionTypeMasterService = async (status?: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    if (status === "ALL" || !status) {
      const statuses = ["AC", "IA"];
      let allRows: any[] = [];
      for (const s of statuses) {
        const result = await pool
          .request()
          .input("STATUS", sql.VarChar(50), s)
          .execute("VMaster.SHOW_PAYROLL_DEDUCTION_TYPE_MASTER");
        allRows = allRows.concat(result.recordset || []);
      }
      return serializeRecordset(allRows);
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(50), status)
      .execute("VMaster.SHOW_PAYROLL_DEDUCTION_TYPE_MASTER");
    return serializeRecordset(result.recordset || []);
  } catch (error) {
    console.error("SHOW_PAYROLL_DEDUCTION_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const getPayrollDeductionTypeMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("DEDUCTION_TYPE_ID", sql.Int, id)
      .execute("VMaster.GET_PAYROLL_DEDUCTION_TYPE_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_PAYROLL_DEDUCTION_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const savePayrollDeductionTypeMasterService = async (data: PayrollDeductionTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("DEDUCTION_TYPE_ID", sql.Int, data.DEDUCTION_TYPE_ID ?? 0)
      .input("SALARY_DEDUCTION_TYPE", sql.VarChar(50), data.SALARY_DEDUCTION_TYPE || null)
      .input("DEDUCTION_TYPE_NAME", sql.VarChar(50), data.DEDUCTION_TYPE_NAME || null)
      .input("DEDUCTION_TYPE_DESCRIPTION", sql.VarChar(50), data.DEDUCTION_TYPE_DESCRIPTION || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_PAYROLL_DEDUCTION_TYPE_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save deduction type");

    return {
      message: message || "Data saved successfully",
      DEDUCTION_TYPE_ID: savedData,
    };
  } catch (error) {
    console.error("SAVE_PAYROLL_DEDUCTION_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const updatePayrollDeductionTypeMasterService = async (data: PayrollDeductionTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("DEDUCTION_TYPE_ID", sql.Int, data.DEDUCTION_TYPE_ID ?? 0)
      .input("SALARY_DEDUCTION_TYPE", sql.VarChar(50), data.SALARY_DEDUCTION_TYPE ?? null)
      .input("DEDUCTION_TYPE_NAME", sql.VarChar(50), data.DEDUCTION_TYPE_NAME ?? null)
      .input("DEDUCTION_TYPE_DESCRIPTION", sql.VarChar(50), data.DEDUCTION_TYPE_DESCRIPTION ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_PAYROLL_DEDUCTION_TYPE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update deduction type");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_PAYROLL_DEDUCTION_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const deletePayrollDeductionTypeMasterService = async (
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
      .input("DEDUCTION_TYPE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_PAYROLL_DEDUCTION_TYPE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete deduction type");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    const msg = (error as any)?.message || "";
    if (msg.includes("REFERENCE constraint") || msg.includes("FK_")) {
      throw new Error("Cannot delete: This deduction type has associated records.");
    }
    throw error;
  }
};