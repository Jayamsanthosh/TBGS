import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface ShiftNameMasterData {
  SHIFT_NAME_ID?: number;
  SHIFT_NAME?: string;
  SHIFT_DESCRIPTION?: string;
  IN_TIME?: string;
  OUT_TIME?: string;
  TOTAL_HOURS?: number;
  BREAK_HOURS?: number;
  ACTUAL_WORKING_HOURS?: number;
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
  (rows || []).map((r: any) => ({ ...formatRow(r), id: r.SHIFT_NAME_ID }));

const numOrNull = (v: any): number | null =>
  v === undefined || v === null || v === "" ? null : Number(v);

const formatTime = (v: any): string | null => {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date && !isNaN(v.getTime())) {
    const h = String(v.getUTCHours()).padStart(2, "0");
    const m = String(v.getUTCMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  }
  const s = String(v);
  const match = s.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    return `${String(Number(match[1])).padStart(2, "0")}:${match[2]}`;
  }
  return s;
};

const formatRow = (r: any) => ({
  ...r,
  IN_TIME: formatTime(r.IN_TIME),
  OUT_TIME: formatTime(r.OUT_TIME),
});

export const getAllShiftNameMasterService = async (status?: string) => {
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
          .execute("VMaster.SHOW_SHIFT_NAME_MASTER");
        allRows = allRows.concat(result.recordset || []);
      }
      return serializeRecordset(allRows);
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(50), status)
      .execute("VMaster.SHOW_SHIFT_NAME_MASTER");
    return serializeRecordset(result.recordset || []);
  } catch (error) {
    console.error("SHOW_SHIFT_NAME_MASTER SP error:", error);
    throw error;
  }
};

export const getShiftNameMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SHIFT_NAME_ID", sql.Int, id)
      .execute("VMaster.GET_SHIFT_NAME_MASTER");

    const row = result.recordset[0] || null;
    return row ? formatRow(row) : null;
  } catch (error) {
    console.error("GET_SHIFT_NAME_MASTER SP error:", error);
    throw error;
  }
};

export const saveShiftNameMasterService = async (data: ShiftNameMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SHIFT_NAME_ID", sql.Int, data.SHIFT_NAME_ID ?? 0)
      .input("SHIFT_NAME", sql.VarChar(50), data.SHIFT_NAME || null)
      .input("SHIFT_DESCRIPTION", sql.VarChar(50), data.SHIFT_DESCRIPTION || null)
      .input("IN_TIME", sql.VarChar(50), data.IN_TIME || null)
      .input("OUT_TIME", sql.VarChar(50), data.OUT_TIME || null)
      .input("TOTAL_HOURS", sql.Decimal(5, 2), numOrNull(data.TOTAL_HOURS))
      .input("BREAK_HOURS", sql.Decimal(5, 2), numOrNull(data.BREAK_HOURS))
      .input("ACTUAL_WORKING_HOURS", sql.Decimal(5, 2), numOrNull(data.ACTUAL_WORKING_HOURS))
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_SHIFT_NAME_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save shift name");

    return {
      message: message || "Data saved successfully",
      SHIFT_NAME_ID: savedData,
    };
  } catch (error) {
    console.error("SAVE_SHIFT_NAME_MASTER SP error:", error);
    throw error;
  }
};

export const updateShiftNameMasterService = async (data: ShiftNameMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SHIFT_NAME_ID", sql.Int, data.SHIFT_NAME_ID ?? 0)
      .input("SHIFT_NAME", sql.VarChar(50), data.SHIFT_NAME ?? null)
      .input("SHIFT_DESCRIPTION", sql.VarChar(50), data.SHIFT_DESCRIPTION ?? null)
      .input("IN_TIME", sql.VarChar(50), data.IN_TIME ?? null)
      .input("OUT_TIME", sql.VarChar(50), data.OUT_TIME ?? null)
      .input("TOTAL_HOURS", sql.Decimal(5, 2), numOrNull(data.TOTAL_HOURS))
      .input("BREAK_HOURS", sql.Decimal(5, 2), numOrNull(data.BREAK_HOURS))
      .input("ACTUAL_WORKING_HOURS", sql.Decimal(5, 2), numOrNull(data.ACTUAL_WORKING_HOURS))
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_SHIFT_NAME_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update shift name");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_SHIFT_NAME_MASTER SP error:", error);
    throw error;
  }
};

export const deleteShiftNameMasterService = async (
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
      .input("SHIFT_NAME_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_SHIFT_NAME_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete shift name");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    const msg = (error as any)?.message || "";
    if (msg.includes("REFERENCE constraint") || msg.includes("FK_")) {
      throw new Error("Cannot delete: This shift name is in use by other records.");
    }
    throw error;
  }
};