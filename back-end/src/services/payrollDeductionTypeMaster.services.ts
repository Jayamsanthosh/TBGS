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
  LINK_ID?: number | null;
}

const toInt = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

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

export const getPayrollDeductionTypeMasterByIdService = async (id: number, linkId?: number | null) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const resolvedLinkId = toInt(linkId) ?? 221;

  try {
    const result = await pool
      .request()
      .input("DEDUCTION_TYPE_ID", sql.Int, id)
      .input("LINK_ID", sql.Int, resolvedLinkId)
      .execute("VMaster.GET_PAYROLL_DEDUCTION_TYPE_MASTER");

    if (result.recordset?.[0]) {
      return result.recordset[0];
    }

    // Fallback if record exists with different/null link_id
    const fallback = await pool
      .request()
      .input("DEDUCTION_TYPE_ID", sql.Int, id)
      .query(`
        SELECT * FROM [VMaster].[TBL_PAYROLL_DEDUCTION_TYPE_MASTER]
        WHERE DEDUCTION_TYPE_ID = @DEDUCTION_TYPE_ID
      `);

    return fallback.recordset?.[0] || null;
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
      .input("DEDUCTION_TYPE_ID", sql.Int, toInt(data.DEDUCTION_TYPE_ID) ?? 0)
      .input("SALARY_DEDUCTION_TYPE", sql.VarChar(50), data.SALARY_DEDUCTION_TYPE || null)
      .input("DEDUCTION_TYPE_NAME", sql.VarChar(50), data.DEDUCTION_TYPE_NAME || null)
      .input("DEDUCTION_TYPE_DESCRIPTION", sql.VarChar(50), data.DEDUCTION_TYPE_DESCRIPTION || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || "AC")
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .input("LINK_ID", sql.Int, toInt(data.LINK_ID) ?? 221)
      .execute("VMaster.SAVE_PAYROLL_DEDUCTION_TYPE_MASTER");

    const { message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save deduction type");

    let newId = toInt(savedData) || toInt(data.DEDUCTION_TYPE_ID);
    if (!newId || newId === 0) {
      const idRes = await pool
        .request()
        .input("SALARY_DEDUCTION_TYPE", sql.VarChar(50), data.SALARY_DEDUCTION_TYPE)
        .input("DEDUCTION_TYPE_NAME", sql.VarChar(50), data.DEDUCTION_TYPE_NAME)
        .query(
          `SELECT TOP 1 DEDUCTION_TYPE_ID FROM [VMaster].[TBL_PAYROLL_DEDUCTION_TYPE_MASTER] WHERE SALARY_DEDUCTION_TYPE = @SALARY_DEDUCTION_TYPE AND DEDUCTION_TYPE_NAME = @DEDUCTION_TYPE_NAME ORDER BY DEDUCTION_TYPE_ID DESC`
        );
      newId = idRes.recordset?.[0]?.DEDUCTION_TYPE_ID;
    }

    return {
      message: message || "Data Saved Successfully",
      DEDUCTION_TYPE_ID: newId,
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
      .input("DEDUCTION_TYPE_ID", sql.Int, toInt(data.DEDUCTION_TYPE_ID) ?? 0)
      .input("SALARY_DEDUCTION_TYPE", sql.VarChar(50), data.SALARY_DEDUCTION_TYPE ?? null)
      .input("DEDUCTION_TYPE_NAME", sql.VarChar(50), data.DEDUCTION_TYPE_NAME ?? null)
      .input("DEDUCTION_TYPE_DESCRIPTION", sql.VarChar(50), data.DEDUCTION_TYPE_DESCRIPTION ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? "AC")
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .input("LINK_ID", sql.Int, toInt(data.LINK_ID) ?? 221)
      .execute("VMaster.UPDATE_PAYROLL_DEDUCTION_TYPE_MASTER");

    const { message, data: updatedId } = parseSprocResult(result.recordset?.[0], "Failed to update deduction type");

    return {
      message: message || "Data Updated Successfully",
      DEDUCTION_TYPE_ID: toInt(updatedId) || toInt(data.DEDUCTION_TYPE_ID),
    };
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

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to delete deduction type");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    const msg = (error as any)?.message || "";
    if (msg.includes("REFERENCE constraint") || msg.includes("FK_")) {
      throw new Error("Cannot delete: This deduction type has associated records.");
    }
    console.error("DELETE_PAYROLL_DEDUCTION_TYPE_MASTER SP error:", error);
    throw error;
  }
};