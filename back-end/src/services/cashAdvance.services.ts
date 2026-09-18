import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface CashAdvanceData {
  SNO?: number;
  CASH_ADV_REQUEST_REF_NO?: string;
  SALARY_DEDUCTION_TYPE?: string;
  ADVANCE_TYPE?: string;
  MONTH_ENTERED?: string;
  YEAR_ENTERED?: number;
  EMP_ID?: number;
  FIRST_NAME?: string;
  MIDDLE_NAME?: string;
  LAST_NAME?: string;
  COMPANY_ID?: number;
  DEPARTMENT_ID?: number;
  DESIGNATION_ID?: number;
  DEPARTMENT_GROUP_ID?: number;
  DESIGNATION_GROUP_ID?: number;
  CAMP_ID?: number;
  STORE_ID?: number;
  EMPLOYMENT_TYPE_ID?: number;
  CURRENCY_ID?: number;
  ADVANCE_AMOUNT?: number;
  REASON?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const normalizeRow = (r: any) => ({
  ...r,
  STATUS_MASTER: r.STATUS_MASTER ?? r.STATUS ?? null,
});

const numOrNull = (v: any): number | null =>
  v === undefined || v === null || v === "" ? null : Number(v);

const getStatus = (r: any) => r?.STATUS ?? r?.[""]?.[0] ?? "";
const getMessage = (r: any) => r?.MESSAGE ?? r?.[""]?.[1] ?? "";
const getData = (r: any) => r?.DATA ?? r?.[""]?.[2] ?? "";

export const getAllCashAdvancesService = async (status = "ALL", allowedCompanyIds?: number[]) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const applyCompanyScope = (rows: any[]): any[] => {
    if (!Array.isArray(allowedCompanyIds) || allowedCompanyIds.length === 0) return rows;
    const allowed = new Set(allowedCompanyIds.map(Number));
    return rows.filter((r) => allowed.has(Number(r.COMPANY_ID)));
  };

  try {
    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(20), status || "ALL")
      .query(`
        SELECT [SNO]
              ,[CASH_ADV_REQUEST_REF_NO]
              ,[SALARY_DEDUCTION_TYPE]
              ,[ADVANCE_TYPE]
              ,[MONTH_ENTERED]
              ,[YEAR_ENTERED]
              ,[EMP_ID]
              ,[FIRST_NAME]
              ,[MIDDLE_NAME]
              ,[LAST_NAME]
              ,[COMPANY_ID]
              ,[DEPARTMENT_ID]
              ,[DESIGNATION_ID]
              ,[DEPARTMENT_GROUP_ID]
              ,[DESIGNATION_GROUP_ID]
              ,[CAMP_ID]
              ,[STORE_ID]
              ,[EMPLOYMENT_TYPE_ID]
              ,[CURRENCY_ID]
              ,[ADVANCE_AMOUNT]
              ,[REASON]
              ,[REMARKS]
              ,[STATUS_MASTER]
              ,[CREATED_BY]
              ,[CREATED_DATE]
              ,[CREATED_MAC_ADDRESS]
              ,[MODIFIED_BY]
              ,[MODIFIED_DATE]
              ,[MODIFIED_MAC_ADDRESS]
        FROM [VPayEntries].[TBL_CASH_ADVANCE]
        WHERE @STATUS = 'ALL' OR STATUS_MASTER = @STATUS
        ORDER BY SNO DESC
      `);
    return applyCompanyScope(result.recordset || []).map(normalizeRow);
  } catch (error) {
    console.error("SHOW_CASH_ADVANCE list query error:", error);
    throw error;
  }
};

export const getCashAdvanceByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, id)
      .execute("VPayEntries.GET_CASH_ADVANCE");

    const row = result.recordset[0] || null;
    return row ? normalizeRow(row) : null;
  } catch (error) {
    console.error("GET_CASH_ADVANCE SP error:", error);
    throw error;
  }
};

export const saveCashAdvanceService = async (data: CashAdvanceData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("CASH_ADV_REQUEST_REF_NO", sql.VarChar(50), data.CASH_ADV_REQUEST_REF_NO || null)
      .input("SALARY_DEDUCTION_TYPE", sql.VarChar(50), data.SALARY_DEDUCTION_TYPE || null)
      .input("ADVANCE_TYPE", sql.VarChar(50), data.ADVANCE_TYPE || null)
      .input("MONTH_ENTERED", sql.VarChar(25), data.MONTH_ENTERED || null)
      .input("YEAR_ENTERED", sql.Int, numOrNull(data.YEAR_ENTERED))
      .input("EMP_ID", sql.Int, numOrNull(data.EMP_ID))
      .input("FIRST_NAME", sql.VarChar(50), data.FIRST_NAME || null)
      .input("MIDDLE_NAME", sql.VarChar(50), data.MIDDLE_NAME || null)
      .input("LAST_NAME", sql.VarChar(50), data.LAST_NAME || null)
      .input("COMPANY_ID", sql.Int, numOrNull(data.COMPANY_ID))
      .input("DEPARTMENT_ID", sql.Int, numOrNull(data.DEPARTMENT_ID))
      .input("DESIGNATION_ID", sql.Int, numOrNull(data.DESIGNATION_ID))
      .input("DEPARTMENT_GROUP_ID", sql.Int, numOrNull(data.DEPARTMENT_GROUP_ID))
      .input("DESIGNATION_GROUP_ID", sql.Int, numOrNull(data.DESIGNATION_GROUP_ID))
      .input("CAMP_ID", sql.Int, numOrNull(data.CAMP_ID))
      .input("STORE_ID", sql.Int, numOrNull(data.STORE_ID))
      .input("EMPLOYMENT_TYPE_ID", sql.Int, numOrNull(data.EMPLOYMENT_TYPE_ID))
      .input("CURRENCY_ID", sql.Int, numOrNull(data.CURRENCY_ID))
      .input("ADVANCE_AMOUNT", sql.Decimal(15, 2), numOrNull(data.ADVANCE_AMOUNT))
      .input("REASON", sql.VarChar(3000), data.REASON || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VPayEntries.SAVE_CASH_ADVANCE");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save cash advance");

    const dataValue = savedData;
    return {
      message: message || "Data saved successfully",
      SNO: dataValue !== undefined && dataValue !== null && dataValue !== "" ? Number(dataValue) : undefined,
    };
  } catch (error) {
    console.error("SAVE_CASH_ADVANCE SP error:", error);
    throw error;
  }
};

export const updateCashAdvanceService = async (data: CashAdvanceData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const existing = await getCashAdvanceByIdService(data.SNO ?? 0);
    if (!existing) {
      throw new Error("RECORD DOES NOT EXIST");
    }

    const result = await pool
      .request()
      .input("SNO", sql.Int, data.SNO ?? 0)
      .input("CASH_ADV_REQUEST_REF_NO", sql.VarChar(50), data.CASH_ADV_REQUEST_REF_NO ?? null)
      .input("SALARY_DEDUCTION_TYPE", sql.VarChar(50), data.SALARY_DEDUCTION_TYPE ?? null)
      .input("ADVANCE_TYPE", sql.VarChar(50), data.ADVANCE_TYPE ?? null)
      .input("MONTH_ENTERED", sql.VarChar(25), data.MONTH_ENTERED ?? null)
      .input("YEAR_ENTERED", sql.Int, numOrNull(data.YEAR_ENTERED))
      .input("EMP_ID", sql.Int, numOrNull(data.EMP_ID))
      .input("FIRST_NAME", sql.VarChar(50), data.FIRST_NAME ?? null)
      .input("MIDDLE_NAME", sql.VarChar(50), data.MIDDLE_NAME ?? null)
      .input("LAST_NAME", sql.VarChar(50), data.LAST_NAME ?? null)
      .input("COMPANY_ID", sql.Int, numOrNull(data.COMPANY_ID))
      .input("DEPARTMENT_ID", sql.Int, numOrNull(data.DEPARTMENT_ID))
      .input("DESIGNATION_ID", sql.Int, numOrNull(data.DESIGNATION_ID))
      .input("DEPARTMENT_GROUP_ID", sql.Int, numOrNull(data.DEPARTMENT_GROUP_ID))
      .input("DESIGNATION_GROUP_ID", sql.Int, numOrNull(data.DESIGNATION_GROUP_ID))
      .input("CAMP_ID", sql.Int, numOrNull(data.CAMP_ID))
      .input("STORE_ID", sql.Int, numOrNull(data.STORE_ID))
      .input("EMPLOYMENT_TYPE_ID", sql.Int, numOrNull(data.EMPLOYMENT_TYPE_ID))
      .input("CURRENCY_ID", sql.Int, numOrNull(data.CURRENCY_ID))
      .input("ADVANCE_AMOUNT", sql.Decimal(15, 2), numOrNull(data.ADVANCE_AMOUNT))
      .input("REASON", sql.VarChar(3000), data.REASON ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VPayEntries.UPDATE_CASH_ADVANCE");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update cash advance");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_CASH_ADVANCE SP error:", error);
    throw error;
  }
};

export const deleteCashAdvanceService = async (
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
      .input("SNO", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VPayEntries.DELETE_CASH_ADVANCE");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete cash advance");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_CASH_ADVANCE SP error:", error);
    throw error;
  }
};