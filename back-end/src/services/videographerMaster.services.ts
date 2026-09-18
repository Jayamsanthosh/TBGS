import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface VideographerMasterData {
  VIDEOGRAPHER_ID?: number;
  VIDEOGRAPHER_NAME?: string;
  ADDRESS?: string;
  LOCATION_NAME?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const serializeRecordset = (rows: any[]) =>
  (rows || []).map((r: any) => ({ ...r, id: r.VIDEOGRAPHER_ID }));

export const getAllVideographerMasterService = async (status?: string) => {
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
          .execute("VMaster.SHOW_VIDEOGRAPHER_MASTER");
        allRows = allRows.concat(result.recordset || []);
      }
      return serializeRecordset(allRows);
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(50), status)
      .execute("VMaster.SHOW_VIDEOGRAPHER_MASTER");
    return serializeRecordset(result.recordset || []);
  } catch (error) {
    console.error("SHOW_VIDEOGRAPHER_MASTER SP error:", error);
    throw error;
  }
};

export const getVideographerMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("VIDEOGRAPHER_ID", sql.Int, id)
      .execute("VMaster.GET_VIDEOGRAPHER_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_VIDEOGRAPHER_MASTER SP error:", error);
    throw error;
  }
};

export const saveVideographerMasterService = async (data: VideographerMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("VIDEOGRAPHER_ID", sql.Int, 0)
      .input("VIDEOGRAPHER_NAME", sql.VarChar(50), data.VIDEOGRAPHER_NAME || null)
      .input("ADDRESS", sql.VarChar(50), data.ADDRESS || null)
      .input("LOCATION_NAME", sql.VarChar(50), data.LOCATION_NAME || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_VIDEOGRAPHER_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save videographer");

    return { message: message || "Data saved successfully", VIDEOGRAPHER_ID: savedData };
  } catch (error) {
    console.error("SAVE_VIDEOGRAPHER_MASTER SP error:", error);
    throw error;
  }
};

export const updateVideographerMasterService = async (data: VideographerMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("VIDEOGRAPHER_ID", sql.Int, data.VIDEOGRAPHER_ID ?? 0)
      .input("VIDEOGRAPHER_NAME", sql.VarChar(50), data.VIDEOGRAPHER_NAME ?? null)
      .input("ADDRESS", sql.VarChar(50), data.ADDRESS ?? null)
      .input("LOCATION_NAME", sql.VarChar(50), data.LOCATION_NAME ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_VIDEOGRAPHER_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update videographer");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_VIDEOGRAPHER_MASTER SP error:", error);
    throw error;
  }
};

export const deleteVideographerMasterService = async (
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
      .input("VIDEOGRAPHER_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_VIDEOGRAPHER_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete videographer");

    return { message: message || "Data deleted successfully" };
  } catch (error) {
    const msg = (error as any)?.message || "";
    if (msg.includes("REFERENCE constraint") || msg.includes("FK_")) {
      throw new Error("Cannot delete: This videographer has associated records.");
    }
    throw error;
  }
};