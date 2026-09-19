import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface DeductionEntriesData {
  DED_REF_ID?: number;
  M_AUTO_REF_NO?: number;
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
  DEDUCTION_AMOUNT?: number;
  REMARKS?: string;
  STATUS_ENTRY?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const numOrNull = (v: any): number | null =>
  v === undefined || v === null || v === "" ? null : Number(v);

const getStatus = (r: any) => r?.STATUS ?? r?.[""]?.[0] ?? "";
const getMessage = (r: any) => r?.MESSAGE ?? r?.[""]?.[1] ?? "";
const getData = (r: any) => r?.DATA ?? r?.[""]?.[2] ?? "";

export const getAllDeductionEntriesService = async (
  status = "ALL",
  allowedCompanyIds?: number[],
  fromDate?: string,
  toDate?: string
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
      .input("FROM_DATE", sql.VarChar(10), fromDate || null)
      .input("TO_DATE", sql.VarChar(10), toDate || null)
      .query(`
        SELECT [DED_REF_ID]
              ,[M_AUTO_REF_NO]
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
              ,[DEDUCTION_AMOUNT]
              ,[REMARKS]
              ,[STATUS_ENTRY]
              ,[STATUS_ENTRY] AS STATUS_MASTER
              ,[CREATED_BY]
              ,[CREATED_DATE]
              ,[CREATED_MAC_ADDRESS]
              ,[MODIFIED_BY]
              ,[MODIFIED_DATE]
              ,[MODIFIED_MAC_ADDRESS]
        FROM [VPayEntries].[TBL_DEDUCTION_ENTRIES]
        WHERE (@STATUS = 'ALL' OR STATUS_ENTRY = @STATUS)
          AND (@FROM_DATE IS NULL OR CAST(CREATED_DATE AS DATE) >= CAST(@FROM_DATE AS DATE))
          AND (@TO_DATE IS NULL OR CAST(CREATED_DATE AS DATE) <= CAST(@TO_DATE AS DATE))
        ORDER BY DED_REF_ID DESC
      `);
    return applyCompanyScope(result.recordset || []);
  } catch (error) {
    console.error("DEDUCTION_ENTRIES list query error:", error);
    throw error;
  }
};

export const getDeductionEntriesByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("DED_REF_ID", sql.Int, id)
      .execute("VPayEntries.GET_DEDUCTION_ENTRIES");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_DEDUCTION_ENTRIES SP error:", error);
    throw error;
  }
};

export const saveDeductionEntriesService = async (data: DeductionEntriesData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("DED_REF_ID", sql.Int, numOrNull(data.DED_REF_ID))
      .input("M_AUTO_REF_NO", sql.Int, numOrNull(data.M_AUTO_REF_NO))
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
      .input("DEDUCTION_AMOUNT", sql.Decimal(15, 2), numOrNull(data.DEDUCTION_AMOUNT))
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_ENTRY", sql.VarChar(20), data.STATUS_ENTRY || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VPayEntries.SAVE_DEDUCTION_ENTRIES");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save deduction entry");

    const dataValue = savedData;
    return {
      message: message || "Data saved successfully",
      DED_REF_ID:
        dataValue !== undefined && dataValue !== null && dataValue !== ""
          ? Number(dataValue)
          : undefined,
    };
  } catch (error) {
    console.error("SAVE_DEDUCTION_ENTRIES SP error:", error);
    throw error;
  }
};

export const updateDeductionEntriesService = async (data: DeductionEntriesData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("DED_REF_ID", sql.Int, numOrNull(data.DED_REF_ID))
      .input("M_AUTO_REF_NO", sql.Int, numOrNull(data.M_AUTO_REF_NO))
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
      .input("DEDUCTION_AMOUNT", sql.Decimal(15, 2), numOrNull(data.DEDUCTION_AMOUNT))
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_ENTRY", sql.VarChar(20), data.STATUS_ENTRY ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VPayEntries.UPDATE_DEDUCTION_ENTRIES");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update deduction entry");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_DEDUCTION_ENTRIES SP error:", error);
    throw error;
  }
};

export const submitDeductionEntriesService = async (refNo: string, role = "Administrator") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("DED_REF_ID", sql.VarChar(50), refNo)
      .input("Role", sql.VarChar(50), role || "Administrator")
      .execute("VPayEntries.SUBMIT_DEDUCTION_ENTRIES");

    const row = result.recordset?.[0];
    const text = row ? Object.values(row).join("") : "";
    const output = String(text || "").trim();

    if (/error|not found|already|invalid/i.test(output)) {
      throw new Error(output || "Failed to submit deduction entries");
    }

    return {
      status: "",
      message: output.includes("Submitted Successfully")
        ? "Deduction entries submitted successfully"
        : output || "Deduction entries submitted successfully",
    };
  } catch (error) {
    console.error("SUBMIT_DEDUCTION_ENTRIES SP error:", error);
    throw error;
  }
};

export const deleteDeductionEntriesService = async (
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
      .input("DED_REF_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VPayEntries.DELETE_DEDUCTION_ENTRIES");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete deduction entry");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_DEDUCTION_ENTRIES SP error:", error);
    throw error;
  }
};