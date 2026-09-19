import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface CaliberMasterData {
  CALIBER_ID?: number;
  CALIBER_CODE: string;
  CALIBER_NAME: string;
  METRIC_SIZE?: string;
  DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllCaliberMasterService = async (status = "AC") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("status", sql.VarChar(10), status)
      .execute("VMaster.SHOW_CALIBER_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_CALIBER_MASTER SP error:", error);
    throw error;
  }
};

export const getCaliberMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("CALIBER_ID", sql.Int, id)
      .execute("VMaster.GET_CALIBER_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_CALIBER_MASTER SP error:", error);
    throw error;
  }
};

export const saveCaliberMasterService = async (data: CaliberMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("CALIBER_ID", sql.Int, data.CALIBER_ID ?? 0)
      .input("CALIBER_CODE", sql.VarChar(20), data.CALIBER_CODE || null)
      .input("CALIBER_NAME", sql.VarChar(100), data.CALIBER_NAME || null)
      .input("METRIC_SIZE", sql.VarChar(50), data.METRIC_SIZE || null)
      .input("DESCRIPTION", sql.VarChar(200), data.DESCRIPTION || null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_CALIBER_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save caliber");

    return { message: message || "Data saved successfully", CALIBER_ID: savedData };
  } catch (error) {
    console.error("SAVE_CALIBER_MASTER SP error:", error);
    throw error;
  }
};

export const updateCaliberMasterService = async (data: CaliberMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("CALIBER_ID", sql.Int, data.CALIBER_ID ?? 0)
      .input("CALIBER_CODE", sql.VarChar(20), data.CALIBER_CODE ?? null)
      .input("CALIBER_NAME", sql.VarChar(100), data.CALIBER_NAME ?? null)
      .input("METRIC_SIZE", sql.VarChar(50), data.METRIC_SIZE ?? null)
      .input("DESCRIPTION", sql.VarChar(200), data.DESCRIPTION ?? null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_CALIBER_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update caliber");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_CALIBER_MASTER SP error:", error);
    throw error;
  }
};

export const deleteCaliberMasterService = async (
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
      .input("CALIBER_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_CALIBER_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete caliber");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_CALIBER_MASTER SP error:", error);
    throw error;
  }
};