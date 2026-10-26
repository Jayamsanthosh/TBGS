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
  LINK_ID?: number | null;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

const STYLED_DATE_RE = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/;
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})/;

const toIsoDate = (value: unknown): unknown => {
  if (value === null || value === undefined || value === "") return value;
  const text = String(value).trim();
  const styled = STYLED_DATE_RE.exec(text);
  if (styled) {
    const month = MONTHS.indexOf(styled[2].toLowerCase());
    if (month >= 0) {
      return `${styled[3]}-${String(month + 1).padStart(2, "0")}-${styled[1].padStart(2, "0")}`;
    }
  }
  return value;
};

const normalizeTaxRow = (row: any): any =>
  row
    ? {
        ...row,
        EFFECTIVE_FROM: toIsoDate(row.EFFECTIVE_FROM),
        EFFECTIVE_TO: toIsoDate(row.EFFECTIVE_TO),
      }
    : row;

const toSqlDate = (value: unknown): Date | null => {
  if (value === null || value === undefined || value === "") return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }

  const text = String(value).trim();

  const iso = ISO_DATE_RE.exec(text);
  if (iso) {
    const date = new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const styled = STYLED_DATE_RE.exec(text);
  if (styled) {
    const month = MONTHS.indexOf(styled[2].toLowerCase());
    if (month >= 0) {
      const date = new Date(Date.UTC(Number(styled[3]), month, Number(styled[1])));
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }

  const fallback = new Date(text);
  if (Number.isNaN(fallback.getTime())) return null;
  return new Date(Date.UTC(fallback.getFullYear(), fallback.getMonth(), fallback.getDate()));
};

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
      rows.push(...((result.recordset || []) as any[]).map(normalizeTaxRow));
    }
    return rows;
  } catch (error) {
    console.error("SHOW_TAX_MASTER SP error:", error);
    throw error;
  }
};

export const getTaxMasterByIdService = async (id: number, linkId?: number | null) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("TAX_ID", sql.Int, id)
      .input("LINK_ID", sql.Int, linkId ?? null)
      .execute("VMASTER.GET_TAX_MASTER");

    return normalizeTaxRow(result.recordset[0] || null);
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
      .input("EFFECTIVE_FROM", sql.DateTime, toSqlDate(data.EFFECTIVE_FROM))
      .input("EFFECTIVE_TO", sql.DateTime, toSqlDate(data.EFFECTIVE_TO))
      .input("REMARKS", sql.VarChar(2000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), normalizeStatus(data.STATUS_MASTER))
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .input("LINK_ID", sql.Int, data.LINK_ID ?? null)
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
      .input("EFFECTIVE_FROM", sql.DateTime, toSqlDate(data.EFFECTIVE_FROM))
      .input("EFFECTIVE_TO", sql.DateTime, toSqlDate(data.EFFECTIVE_TO))
      .input("REMARKS", sql.VarChar(2000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), normalizeStatus(data.STATUS_MASTER))
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .input("LINK_ID", sql.Int, data.LINK_ID ?? null)
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