import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface GunSourceTypeMasterData {
  GUN_SOURCE_TYPE_ID?: number;
  GUN_SOURCE_TYPE_NAME: string;
  GUN_SOURCE_TYPE_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const serializeRecordset = (rows: any[]) =>
  (rows || []).map((r: any) => ({ ...r, id: r.GUN_SOURCE_TYPE_ID }));

export const getAllGunSourceTypeMasterService = async (status?: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    if (status === "ALL" || !status) {
      const statuses = ["AC", "IN"];
      let allRows: any[] = [];
      for (const s of statuses) {
        const result = await pool
          .request()
          .input("STATUS", sql.VarChar(50), s)
          .execute("VMaster.SHOW_GUN_SOURCE_TYPE_MASTER");
        allRows = allRows.concat(result.recordset || []);
      }
      return serializeRecordset(allRows);
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(50), status)
      .execute("VMaster.SHOW_GUN_SOURCE_TYPE_MASTER");
    return serializeRecordset(result.recordset || []);
  } catch (error) {
    console.error("SHOW_GUN_SOURCE_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const getGunSourceTypeMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("GUN_SOURCE_TYPE_ID", sql.Int, id)
      .execute("VMaster.GET_GUN_SOURCE_TYPE_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_GUN_SOURCE_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const saveGunSourceTypeMasterService = async (data: GunSourceTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("GUN_SOURCE_TYPE_ID", sql.Int, data.GUN_SOURCE_TYPE_ID ?? 0)
      .input("GUN_SOURCE_TYPE_NAME", sql.VarChar(100), data.GUN_SOURCE_TYPE_NAME || null)
      .input("GUN_SOURCE_TYPE_DESCRIPTION", sql.VarChar(100), data.GUN_SOURCE_TYPE_DESCRIPTION || null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_GUN_SOURCE_TYPE_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save gun source type");

    return { message: message || "Data saved successfully", GUN_SOURCE_TYPE_ID: savedData };
  } catch (error) {
    console.error("SAVE_GUN_SOURCE_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const updateGunSourceTypeMasterService = async (data: GunSourceTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("GUN_SOURCE_TYPE_ID", sql.Int, data.GUN_SOURCE_TYPE_ID ?? 0)
      .input("GUN_SOURCE_TYPE_NAME", sql.VarChar(100), data.GUN_SOURCE_TYPE_NAME ?? null)
      .input("GUN_SOURCE_TYPE_DESCRIPTION", sql.VarChar(100), data.GUN_SOURCE_TYPE_DESCRIPTION ?? null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_GUN_SOURCE_TYPE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update gun source type");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_GUN_SOURCE_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const deleteGunSourceTypeMasterService = async (
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
      .input("GUN_SOURCE_TYPE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_GUN_SOURCE_TYPE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete gun source type");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_GUN_SOURCE_TYPE_MASTER SP error:", error);
    throw error;
  }
};