import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export const TAX_STATUSES = ["AC", "IN"] as const;

const normalizeStatus = (status: string | undefined | null): string => {
  if (!status) return "AC";
  const s = status.trim().toUpperCase();
  if (s === "ACTIVE" || s === "AC") return "AC";
  if (s === "INACTIVE" || s === "IN" || s === "IA") return "IN";
  return s.substring(0, 2);
};

export interface TaxMasterData {
  TAX_ID?: number;
  TAX_CODE: string;
  TAX_NAME: string;
  TAX_PERCENTAGE?: number;
  TAX_TYPE?: string;
  EFFECTIVE_FROM?: string;
  EFFECTIVE_TO?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
}

export const getAllTaxMasterService = async (status = "ALL") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const normalized = status.trim().toUpperCase();
  const targets =
    normalized === "ALL" ? (TAX_STATUSES as readonly string[]) : [normalized];

  try {
    const rows: any[] = [];
    for (const value of targets) {
      const result = await pool
        .request()
        .input("STATUS", sql.VarChar(50), value)
        .execute("VMASTER.SHOW_TAX_MASTER");
      rows.push(...((result.recordset || []) as any[]));
    }
    return rows;
  } catch (error) {
    console.error("SHOW_TAX_MASTER SP error:", error);
    throw error;
  }
};

export const getTaxMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("TAX_ID", sql.Int, id)
      .execute("VMASTER.GET_TAX_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_TAX_MASTER SP error:", error);
    throw error;
  }
};

export const saveTaxMasterService = async (data: TaxMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("TAX_ID", sql.Int, 0)
      .input("TAX_CODE", sql.VarChar(20), data.TAX_CODE)
      .input("TAX_NAME", sql.VarChar(100), data.TAX_NAME)
      .input("TAX_PERCENTAGE", sql.Decimal(5, 2), data.TAX_PERCENTAGE ?? null)
      .input("TAX_TYPE", sql.VarChar(50), data.TAX_TYPE || null)
      .input("EFFECTIVE_FROM", sql.DateTime, data.EFFECTIVE_FROM || null)
      .input("EFFECTIVE_TO", sql.DateTime, data.EFFECTIVE_TO || null)
      .input("REMARKS", sql.VarChar(2000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), normalizeStatus(data.STATUS_MASTER))
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMASTER.SAVE_TAX_MASTER");

    const { status, message, data: savedId } = parseSprocResult(
      result.recordset?.[0],
      "Failed to save tax"
    );

    return { message: message || "Tax saved successfully", TAX_ID: savedId };
  } catch (error) {
    console.error("SAVE_TAX_MASTER SP error:", error);
    throw error;
  }
};

export const updateTaxMasterService = async (data: TaxMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("TAX_ID", sql.Int, data.TAX_ID ?? 0)
      .input("TAX_CODE", sql.VarChar(20), data.TAX_CODE)
      .input("TAX_NAME", sql.VarChar(100), data.TAX_NAME)
      .input("TAX_PERCENTAGE", sql.Decimal(5, 2), data.TAX_PERCENTAGE ?? null)
      .input("TAX_TYPE", sql.VarChar(50), data.TAX_TYPE || null)
      .input("EFFECTIVE_FROM", sql.DateTime, data.EFFECTIVE_FROM || null)
      .input("EFFECTIVE_TO", sql.DateTime, data.EFFECTIVE_TO || null)
      .input("REMARKS", sql.VarChar(2000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), normalizeStatus(data.STATUS_MASTER))
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMASTER.UPDATE_TAX_MASTER");

    const { status, message, data: savedId } = parseSprocResult(
      result.recordset?.[0],
      "Failed to update tax"
    );

    return { message: message || "Tax updated successfully", TAX_ID: savedId };
  } catch (error) {
    console.error("UPDATE_TAX_MASTER SP error:", error);
    throw error;
  }
};

export const deleteTaxMasterService = async (
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
      .input("TAX_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMASTER.DELETE_TAX_MASTER");

    const { status, message } = parseSprocResult(
      result.recordset?.[0],
      "No rights to delete"
    );

    return { message: message || "Tax deleted successfully" };
  } catch (error) {
    console.error("DELETE_TAX_MASTER SP error:", error);
    throw error;
  }
};