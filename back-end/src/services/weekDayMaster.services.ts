import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface WeekDayMasterData {
  WEEK_DAY_ID?: number;
  WEEK_DAY_NAME?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  ROLE?: string;
  MAC_ADDRESS?: string;
}

/**
 * SPs return rows in two shapes:
 *   - Aliased  : '' AS STATUS, 'Data Saved Successfully' AS MESSAGE, id AS DATA   (SAVE)
 *   - Unaliased: 'error','Week Day Name Already Exists',''                       (SAVE/UPDATE/DELETE errors)
 *                '','Data Updated Successfully',id                              (UPDATE/DELETE success)
 * This helper detects the error in either shape and extracts the exact message + data.
 */
const parseResponse = (row: any) => {
  if (!row) return { message: "", data: null };

  const readCells = () => {
    const emptyKey = row[""];
    if (Array.isArray(emptyKey)) return emptyKey;
    const values = Object.values(row);
    return values;
  };

  const cells = readCells();
  const first = String(cells[0] ?? "").toLowerCase();

  if (first === "error") {
    throw new Error(String(cells[1] ?? "Operation failed"));
  }

  return {
    message: String(row.MESSAGE ?? cells[1] ?? ""),
    data: row.DATA ?? cells[2] ?? null,
  };
};

const serializeRecordset = (rows: any[]) =>
  (rows || []).map((r: any) => ({ ...r, id: r.WEEK_DAY_ID }));

export const getAllWeekDayMasterService = async (status?: string) => {
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
          .execute("VMaster.SHOW_WEEK_DAY_MASTER");
        allRows = allRows.concat(result.recordset || []);
      }
      return serializeRecordset(allRows);
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(50), status)
      .execute("VMaster.SHOW_WEEK_DAY_MASTER");
    return serializeRecordset(result.recordset || []);
  } catch (error) {
    console.error("SHOW_WEEK_DAY_MASTER SP error:", error);
    throw error;
  }
};

export const getWeekDayMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("WEEK_DAY_ID", sql.Int, id)
      .execute("VMaster.GET_WEEK_DAY_MASTER");

    const row = result.recordset[0] || null;
    return row ? serializeRecordset([row])[0] : null;
  } catch (error) {
    console.error("GET_WEEK_DAY_MASTER SP error:", error);
    throw error;
  }
};

export const saveWeekDayMasterService = async (data: WeekDayMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("WEEK_DAY_ID", sql.Int, data.WEEK_DAY_ID ?? 0)
      .input("WEEK_DAY_NAME", sql.VarChar(50), data.WEEK_DAY_NAME || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_WEEK_DAY_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save week day");

    return {
      message: message || "Data saved successfully",
      WEEK_DAY_ID: savedData,
    };
  } catch (error) {
    console.error("SAVE_WEEK_DAY_MASTER SP error:", error);
    throw error;
  }
};

export const updateWeekDayMasterService = async (data: WeekDayMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("WEEK_DAY_ID", sql.Int, data.WEEK_DAY_ID ?? 0)
      .input("WEEK_DAY_NAME", sql.VarChar(50), data.WEEK_DAY_NAME ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_WEEK_DAY_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update week day");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_WEEK_DAY_MASTER SP error:", error);
    throw error;
  }
};

export const deleteWeekDayMasterService = async (
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
      .input("WEEK_DAY_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_WEEK_DAY_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete week day");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    const msg = (error as any)?.message || "";
    if (msg.includes("REFERENCE constraint") || msg.includes("FK_")) {
      throw new Error("Cannot delete: This week day is in use by other records.");
    }
    throw error;
  }
};