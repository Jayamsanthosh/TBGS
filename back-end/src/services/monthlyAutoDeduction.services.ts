import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface MonthlyAutoDeductionData {
  M_AUTO_REF_NO?: number;
  SALARY_DEDUCTION_TYPE?: string;
  REQUEST_REF_NO?: string;
  DEDUCTION_TYPE_ID?: number;
  REQUEST_TYPE?: string;
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
  GROSS_PAY?: number;
  NET_PAY?: number;
  TOTAL_DEDUCTION_AMOUNT?: number;
  DEDUCTION_FROM_DATE?: string | Date;
  DEDUCTION_TO_DATE?: string | Date;
  NO_OF_MONTHS?: number;
  MONTHLY_DEDUCTION?: number;
  REASON?: string;
  APPROVED_BY?: string;
  REMARKS?: string;
  STATUS_ENTRY?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const numOrNull = (v: any): number | null =>
  v === undefined || v === null || v === "" ? null : Number(v);

const dateOrNull = (v: any): string | Date | null =>
  v === undefined || v === null || v === "" ? null : v;

const getStatus = (r: any) => r?.STATUS ?? r?.[""]?.[0] ?? "";
const getMessage = (r: any) => r?.MESSAGE ?? r?.[""]?.[1] ?? "";
const getData = (r: any) => r?.DATA ?? r?.[""]?.[2] ?? "";

export const getAllMonthlyAutoDeductionsService = async (
  status = "ALL",
  allowedCompanyIds?: number[]
) => {
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
        SELECT [M_AUTO_REF_NO]
              ,[SALARY_DEDUCTION_TYPE]
              ,[REQUEST_REF_NO]
              ,[DEDUCTION_TYPE_ID]
              ,[REQUEST_TYPE]
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
              ,[GROSS_PAY]
              ,[NET_PAY]
              ,[TOTAL_DEDUCTION_AMOUNT]
              ,[DEDUCTION_FROM_DATE]
              ,[DEDUCTION_TO_DATE]
              ,[NO_OF_MONTHS]
              ,[MONTHLY_DEDUCTION]
              ,[REASON]
              ,[APPROVED_BY]
              ,[REMARKS]
              ,[STATUS_ENTRY]
              ,[CREATED_BY]
              ,[CREATED_DATE]
              ,[CREATED_MAC_ADDRESS]
              ,[MODIFIED_BY]
              ,[MODIFIED_DATE]
              ,[MODIFIED_MAC_ADDRESS]
        FROM [VPayEntries].[TBL_MONTHLY_AUTO_DEDUCTION]
        WHERE @STATUS = 'ALL' OR STATUS_ENTRY = @STATUS
        ORDER BY M_AUTO_REF_NO DESC
      `);
    return applyCompanyScope(result.recordset || []);
  } catch (error) {
    console.error("SHOW_MONTHLY_AUTO_DEDUCTION list query error:", error);
    throw error;
  }
};

export const getMonthlyAutoDeductionByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("M_AUTO_REF_NO", sql.Int, id)
      .execute("VPayEntries.GET_MONTHLY_AUTO_DEDUCTION");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_MONTHLY_AUTO_DEDUCTION SP error:", error);
    throw error;
  }
};

export const saveMonthlyAutoDeductionService = async (data: MonthlyAutoDeductionData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("M_AUTO_REF_NO", sql.Int, numOrNull(data.M_AUTO_REF_NO))
      .input("SALARY_DEDUCTION_TYPE", sql.VarChar(50), data.SALARY_DEDUCTION_TYPE || null)
      .input("REQUEST_REF_NO", sql.VarChar(50), data.REQUEST_REF_NO || null)
      .input("DEDUCTION_TYPE_ID", sql.Int, numOrNull(data.DEDUCTION_TYPE_ID))
      .input("REQUEST_TYPE", sql.VarChar(50), data.REQUEST_TYPE || null)
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
      .input("GROSS_PAY", sql.Decimal(15, 2), numOrNull(data.GROSS_PAY))
      .input("NET_PAY", sql.Decimal(15, 2), numOrNull(data.NET_PAY))
      .input("TOTAL_DEDUCTION_AMOUNT", sql.Decimal(15, 2), numOrNull(data.TOTAL_DEDUCTION_AMOUNT))
      .input("DEDUCTION_FROM_DATE", sql.DateTime, dateOrNull(data.DEDUCTION_FROM_DATE))
      .input("DEDUCTION_TO_DATE", sql.DateTime, dateOrNull(data.DEDUCTION_TO_DATE))
      .input("NO_OF_MONTHS", sql.Int, numOrNull(data.NO_OF_MONTHS))
      .input("MONTHLY_DEDUCTION", sql.Decimal(15, 2), numOrNull(data.MONTHLY_DEDUCTION))
      .input("REASON", sql.VarChar(3000), data.REASON || null)
      .input("APPROVED_BY", sql.VarChar(50), data.APPROVED_BY || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_ENTRY", sql.VarChar(20), data.STATUS_ENTRY || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VPayEntries.SAVE_MONTHLY_AUTO_DEDUCTION");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save monthly auto deduction");

    const dataValue = savedData;
    return {
      message: message || "Data saved successfully",
      M_AUTO_REF_NO:
        dataValue !== undefined && dataValue !== null && dataValue !== ""
          ? Number(dataValue)
          : undefined,
    };
  } catch (error) {
    console.error("SAVE_MONTHLY_AUTO_DEDUCTION SP error:", error);
    throw error;
  }
};

export const updateMonthlyAutoDeductionService = async (data: MonthlyAutoDeductionData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("M_AUTO_REF_NO", sql.Int, numOrNull(data.M_AUTO_REF_NO))
      .input("SALARY_DEDUCTION_TYPE", sql.VarChar(50), data.SALARY_DEDUCTION_TYPE ?? null)
      .input("REQUEST_REF_NO", sql.VarChar(50), data.REQUEST_REF_NO ?? null)
      .input("DEDUCTION_TYPE_ID", sql.Int, numOrNull(data.DEDUCTION_TYPE_ID))
      .input("REQUEST_TYPE", sql.VarChar(50), data.REQUEST_TYPE ?? null)
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
      .input("GROSS_PAY", sql.Decimal(15, 2), numOrNull(data.GROSS_PAY))
      .input("NET_PAY", sql.Decimal(15, 2), numOrNull(data.NET_PAY))
      .input("TOTAL_DEDUCTION_AMOUNT", sql.Decimal(15, 2), numOrNull(data.TOTAL_DEDUCTION_AMOUNT))
      .input("DEDUCTION_FROM_DATE", sql.DateTime, dateOrNull(data.DEDUCTION_FROM_DATE))
      .input("DEDUCTION_TO_DATE", sql.DateTime, dateOrNull(data.DEDUCTION_TO_DATE))
      .input("NO_OF_MONTHS", sql.Int, numOrNull(data.NO_OF_MONTHS))
      .input("MONTHLY_DEDUCTION", sql.Decimal(15, 2), numOrNull(data.MONTHLY_DEDUCTION))
      .input("REASON", sql.VarChar(3000), data.REASON ?? null)
      .input("APPROVED_BY", sql.VarChar(50), data.APPROVED_BY ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_ENTRY", sql.VarChar(20), data.STATUS_ENTRY ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VPayEntries.UPDATE_MONTHLY_AUTO_DEDUCTION");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update monthly auto deduction");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_MONTHLY_AUTO_DEDUCTION SP error:", error);
    throw error;
  }
};

export const deleteMonthlyAutoDeductionService = async (
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
      .input("M_AUTO_REF_NO", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VPayEntries.DELETE_MONTHLY_AUTO_DEDUCTION");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete monthly auto deduction");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_MONTHLY_AUTO_DEDUCTION SP error:", error);
    throw error;
  }
};