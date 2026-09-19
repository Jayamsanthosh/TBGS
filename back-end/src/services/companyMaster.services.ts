import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface CompanyMasterData {
  COMPANY_ID?: number;
  COMPANY_NAME: string;
  COMPANY_FULL_NAME?: string;
  TIN_NUMBER?: string;
  VRN_NUMBER?: string;
  ADDRESS?: string;
  CONTACT_PERSON?: string;
  CONTACT_NUMBER?: string;
  EMAIL?: string;
  SHORT_CODE?: string;
  FINANCE_START_MONTH?: string;
  FINANCE_END_MONTH?: string;
  YEAR_CODE?: string;
  DEFAULT_CURRENCY_ID?: number;
  TIMEZONE?: string;
  NO_OF_USER?: number;
  WEBSITE?: string;
  COMP_BIG_LOGO?: string | null;
  COMP_SMALL_LOGO?: string | null;
  COMP_LETTER_HEAD?: string | null;
  COMP_STAMP_LOGO?: string | null;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const toBuffer = (val: string | null | undefined): Buffer | null => {
  if (!val) return null;
  try {
    const buf = Buffer.from(val, "base64");
    return buf.length > 0 ? buf : null;
  } catch {
    return null;
  }
};

export const getAllCompanyMasterService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .query("SELECT * FROM VMaster.TBL_COMPANY_MASTER ORDER BY COMPANY_NAME");

    return (result.recordset || []).map((row: any) => ({
      ...row,
      COMP_BIG_LOGO: row.COMP_BIG_LOGO
        ? (row.COMP_BIG_LOGO as Buffer).toString("base64")
        : null,
      COMP_SMALL_LOGO: row.COMP_SMALL_LOGO
        ? (row.COMP_SMALL_LOGO as Buffer).toString("base64")
        : null,
      COMP_LETTER_HEAD: row.COMP_LETTER_HEAD
        ? (row.COMP_LETTER_HEAD as Buffer).toString("base64")
        : null,
      COMP_STAMP_LOGO: row.COMP_STAMP_LOGO
        ? (row.COMP_STAMP_LOGO as Buffer).toString("base64")
        : null,
    }));
  } catch (error) {
    console.error("SHOW_COMPANY_MASTER query error:", error);
    throw error;
  }
};

export const getCompanyMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("COMPANY_ID", sql.Int, id)
      .execute("VMaster.SHOW_COMPANY_MASTER");

    const row = result.recordset[0] || null;
    if (!row) return null;

    return {
      ...row,
      COMP_BIG_LOGO: row.COMP_BIG_LOGO
        ? (row.COMP_BIG_LOGO as Buffer).toString("base64")
        : null,
      COMP_SMALL_LOGO: row.COMP_SMALL_LOGO
        ? (row.COMP_SMALL_LOGO as Buffer).toString("base64")
        : null,
      COMP_LETTER_HEAD: row.COMP_LETTER_HEAD
        ? (row.COMP_LETTER_HEAD as Buffer).toString("base64")
        : null,
      COMP_STAMP_LOGO: row.COMP_STAMP_LOGO
        ? (row.COMP_STAMP_LOGO as Buffer).toString("base64")
        : null,
    };
  } catch (error) {
    console.error("SHOW_COMPANY_MASTER SP error:", error);
    throw error;
  }
};

export const saveCompanyMasterService = async (data: CompanyMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("COMPANY_ID", sql.Int, data.COMPANY_ID ?? 0)
      .input("COMPANY_NAME", sql.VarChar(100), data.COMPANY_NAME || null)
      .input("COMPANY_FULL_NAME", sql.VarChar(150), data.COMPANY_FULL_NAME || null)
      .input("TIN_NUMBER", sql.VarChar(50), data.TIN_NUMBER || null)
      .input("VRN_NUMBER", sql.VarChar(50), data.VRN_NUMBER || null)
      .input("ADDRESS", sql.VarChar(2000), data.ADDRESS || null)
      .input("CONTACT_PERSON", sql.VarChar(50), data.CONTACT_PERSON || null)
      .input("CONTACT_NUMBER", sql.VarChar(50), data.CONTACT_NUMBER || null)
      .input("EMAIL", sql.VarChar(50), data.EMAIL || null)
      .input("SHORT_CODE", sql.VarChar(4), data.SHORT_CODE || null)
      .input("FINANCE_START_MONTH", sql.VarChar(50), data.FINANCE_START_MONTH || null)
      .input("FINANCE_END_MONTH", sql.VarChar(50), data.FINANCE_END_MONTH || null)
      .input("YEAR_CODE", sql.VarChar(50), data.YEAR_CODE || null)
      .input("DEFAULT_CURRENCY_ID", sql.Int, data.DEFAULT_CURRENCY_ID || null)
      .input("TIMEZONE", sql.VarChar(50), data.TIMEZONE || null)
      .input("NO_OF_USER", sql.Int, data.NO_OF_USER || null)
      .input("WEBSITE", sql.VarChar(50), data.WEBSITE || null)
      .input("COMP_BIG_LOGO", sql.VarBinary(sql.MAX), toBuffer(data.COMP_BIG_LOGO))
      .input("COMP_SMALL_LOGO", sql.VarBinary(sql.MAX), toBuffer(data.COMP_SMALL_LOGO))
      .input("COMP_LETTER_HEAD", sql.VarBinary(sql.MAX), toBuffer(data.COMP_LETTER_HEAD))
      .input("COMP_STAMP_LOGO", sql.VarBinary(sql.MAX), toBuffer(data.COMP_STAMP_LOGO))
      .input("REMARKS", sql.VarChar(2000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_COMPANY_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to save company");

    return { message: message || "Company saved successfully" };
  } catch (error) {
    console.error("SAVE_COMPANY_MASTER SP error:", error);
    throw error;
  }
};

export const updateCompanyMasterService = async (data: CompanyMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("COMPANY_ID", sql.Int, data.COMPANY_ID ?? 0)
      .input("COMPANY_NAME", sql.VarChar(100), data.COMPANY_NAME ?? null)
      .input("COMPANY_FULL_NAME", sql.VarChar(150), data.COMPANY_FULL_NAME ?? null)
      .input("TIN_NUMBER", sql.VarChar(50), data.TIN_NUMBER ?? null)
      .input("VRN_NUMBER", sql.VarChar(50), data.VRN_NUMBER ?? null)
      .input("ADDRESS", sql.VarChar(2000), data.ADDRESS ?? null)
      .input("CONTACT_PERSON", sql.VarChar(50), data.CONTACT_PERSON ?? null)
      .input("CONTACT_NUMBER", sql.VarChar(50), data.CONTACT_NUMBER ?? null)
      .input("EMAIL", sql.VarChar(50), data.EMAIL ?? null)
      .input("SHORT_CODE", sql.VarChar(4), data.SHORT_CODE ?? null)
      .input("FINANCE_START_MONTH", sql.VarChar(50), data.FINANCE_START_MONTH ?? null)
      .input("FINANCE_END_MONTH", sql.VarChar(50), data.FINANCE_END_MONTH ?? null)
      .input("YEAR_CODE", sql.VarChar(50), data.YEAR_CODE ?? null)
      .input("DEFAULT_CURRENCY_ID", sql.Int, data.DEFAULT_CURRENCY_ID || null)
      .input("TIMEZONE", sql.VarChar(50), data.TIMEZONE || null)
      .input("NO_OF_USER", sql.Int, data.NO_OF_USER || null)
      .input("WEBSITE", sql.VarChar(50), data.WEBSITE || null)
      .input("COMP_BIG_LOGO", sql.VarBinary(sql.MAX), toBuffer(data.COMP_BIG_LOGO))
      .input("COMP_SMALL_LOGO", sql.VarBinary(sql.MAX), toBuffer(data.COMP_SMALL_LOGO))
      .input("COMP_LETTER_HEAD", sql.VarBinary(sql.MAX), toBuffer(data.COMP_LETTER_HEAD))
      .input("COMP_STAMP_LOGO", sql.VarBinary(sql.MAX), toBuffer(data.COMP_STAMP_LOGO))
      .input("REMARKS", sql.VarChar(2000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.UPDATE_COMPANY_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update company");

    return { message: message || "Company updated successfully" };
  } catch (error) {
    console.error("UPDATE_COMPANY_MASTER SP error:", error);
    throw error;
  }
};

export const deleteCompanyMasterService = async (
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
      .input("COMPANY_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_COMPANY_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete company");

    return { message: message || "Company deleted successfully" };
  } catch (error) {
    console.error("DELETE_COMPANY_MASTER SP error:", error);
    throw error;
  }
};
