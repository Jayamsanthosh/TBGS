import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface CompanyBankAccountData {
  ACCOUNT_ID?: number;
  COMPANY_ID?: number;
  BANK_ID?: number;
  ACCOUNT_NAME?: string;
  ACCOUNT_NUMBER?: string;
  CURRENCY_ID?: number;
  SWIFT_CODE?: string;
  BRANCH_ADDRESS?: string;
  BANK_BRANCH_NAME?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const serializeRecordset = (rows: any[]) =>
  (rows || []).map((r: any) => ({ ...r, id: r.ACCOUNT_ID }));

export const getAllCompanyBankAccountMasterService = async (status?: string) => {
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
          .execute("VMaster.SHOW_COMPANY_BANK_ACCOUNT_MASTER");
        allRows = allRows.concat(result.recordset || []);
      }
      return serializeRecordset(allRows);
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(50), status)
      .execute("VMaster.SHOW_COMPANY_BANK_ACCOUNT_MASTER");
    return serializeRecordset(result.recordset || []);
  } catch (error) {
    console.error("SHOW_COMPANY_BANK_ACCOUNT_MASTER SP error:", error);
    throw error;
  }
};

export const getCompanyBankAccountMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("ACCOUNT_ID", sql.Int, id)
      .execute("VMaster.GET_COMPANY_BANK_ACCOUNT_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_COMPANY_BANK_ACCOUNT_MASTER SP error:", error);
    throw error;
  }
};

export const saveCompanyBankAccountMasterService = async (data: CompanyBankAccountData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("ACCOUNT_ID", sql.Int, 0)
      .input("COMPANY_ID", sql.Int, data.COMPANY_ID ?? null)
      .input("BANK_ID", sql.Int, data.BANK_ID ?? null)
      .input("ACCOUNT_NAME", sql.VarChar(100), data.ACCOUNT_NAME || null)
      .input("ACCOUNT_NUMBER", sql.VarChar(100), data.ACCOUNT_NUMBER || null)
      .input("CURRENCY_ID", sql.Int, data.CURRENCY_ID ?? null)
      .input("SWIFT_CODE", sql.VarChar(50), data.SWIFT_CODE || null)
      .input("BRANCH_ADDRESS", sql.VarChar(200), data.BRANCH_ADDRESS || null)
      .input("BANK_BRANCH_NAME", sql.VarChar(50), data.BANK_BRANCH_NAME || null)
      .input("REMARKS", sql.VarChar(2000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_COMPANY_BANK_ACCOUNT_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save company bank account");

    return { message: message || "Data saved successfully", ACCOUNT_ID: savedData };
  } catch (error) {
    console.error("SAVE_COMPANY_BANK_ACCOUNT_MASTER SP error:", error);
    throw error;
  }
};

export const updateCompanyBankAccountMasterService = async (data: CompanyBankAccountData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("ACCOUNT_ID", sql.Int, data.ACCOUNT_ID ?? 0)
      .input("COMPANY_ID", sql.Int, data.COMPANY_ID ?? null)
      .input("BANK_ID", sql.Int, data.BANK_ID ?? null)
      .input("ACCOUNT_NAME", sql.VarChar(100), data.ACCOUNT_NAME ?? null)
      .input("ACCOUNT_NUMBER", sql.VarChar(100), data.ACCOUNT_NUMBER ?? null)
      .input("CURRENCY_ID", sql.Int, data.CURRENCY_ID ?? null)
      .input("SWIFT_CODE", sql.VarChar(50), data.SWIFT_CODE ?? null)
      .input("BRANCH_ADDRESS", sql.VarChar(200), data.BRANCH_ADDRESS ?? null)
      .input("BANK_BRANCH_NAME", sql.VarChar(50), data.BANK_BRANCH_NAME ?? null)
      .input("REMARKS", sql.VarChar(2000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_COMPANY_BANK_ACCOUNT_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update company bank account");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_COMPANY_BANK_ACCOUNT_MASTER SP error:", error);
    throw error;
  }
};

export const deleteCompanyBankAccountMasterService = async (
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
      .input("ACCOUNT_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_COMPANY_BANK_ACCOUNT_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete company bank account");

    return { message: message || "Data deleted successfully" };
  } catch (error) {
    const msg = (error as any)?.message || "";
    if (msg.includes("REFERENCE constraint") || msg.includes("FK_")) {
      throw new Error("Cannot delete: This account has associated records.");
    }
    throw error;
  }
};