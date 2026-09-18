import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface HolidayEntriesData {
  HOLIDAY_ID?: number;
  HOLIDAY_DATE: string;
  HOLIDAY_REASON: string;
  REMARKS?: string;
  STATUS_MASTER: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

function parseSpResponse(recordset: any[] | undefined, fallback: string) {
  const row = recordset?.[0];
  if (!row) return { message: fallback };
  const unnamed = Array.isArray(row[""]) ? row[""] : null;
  const status = unnamed ? String(unnamed[0] || "") : String(row["STATUS"] || "");
  const message = unnamed ? (unnamed[1] || fallback) : (row["MESSAGE"] || fallback);
  if (status && status.toLowerCase() === "error") {
    throw new Error(message);
  }
  return { message };
}

export const getAllHolidayEntriesService = async (status?: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const request = pool.request();
    if (status) {
      request.input("status", sql.VarChar(20), status);
    }
    const result = await request.execute("VPayEntries.SHOW_HOLIDAY_ENTRIES");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_HOLIDAY_ENTRIES SP error:", error);
    throw error;
  }
};

export const getHolidayEntriesByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("HOLIDAY_ID", sql.Int, id)
      .execute("VPayEntries.GET_HOLIDAY_ENTRIES");
    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_HOLIDAY_ENTRIES SP error:", error);
    throw error;
  }
};

export const saveHolidayEntriesService = async (data: HolidayEntriesData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("HOLIDAY_DATE", sql.DateTime, data.HOLIDAY_DATE || null)
      .input("HOLIDAY_REASON", sql.VarChar(100), data.HOLIDAY_REASON || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VPayEntries.SAVE_HOLIDAY_ENTRIES");
    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to save holiday entry");
    return { message: message || "Holiday entry saved successfully" };
  } catch (error) {
    console.error("SAVE_HOLIDAY_ENTRIES SP error:", error);
    throw error;
  }
};

export const updateHolidayEntriesService = async (data: HolidayEntriesData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("HOLIDAY_ID", sql.Int, data.HOLIDAY_ID ?? 0)
      .input("HOLIDAY_DATE", sql.DateTime, data.HOLIDAY_DATE ?? null)
      .input("HOLIDAY_REASON", sql.VarChar(100), data.HOLIDAY_REASON ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VPayEntries.UPDATE_HOLIDAY_ENTRIES");
    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update holiday entry");
    return { message: message || "Holiday entry updated successfully" };
  } catch (error) {
    console.error("UPDATE_HOLIDAY_ENTRIES SP error:", error);
    throw error;
  }
};

export const deleteHolidayEntriesService = async (
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
      .input("HOLIDAY_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VPayEntries.DELETE_HOLIDAY_ENTRIES");
    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete holiday entry");
    return { message: message || "Holiday entry deleted successfully" };
  } catch (error) {
    console.error("DELETE_HOLIDAY_ENTRIES SP error:", error);
    throw error;
  }
};
