import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface BulletTypeMasterData {
  BULLET_TYPE_ID?: number;
  BULLET_TYPE_NAME: string;
  DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllBulletTypeMasterService = async (status = "AC") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("status", sql.VarChar(10), status)
      .execute("VMaster.SHOW_BULLET_TYPE_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_BULLET_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const getBulletTypeMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("BULLET_TYPE_ID", sql.Int, id)
      .execute("VMaster.GET_BULLET_TYPE_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_BULLET_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const saveBulletTypeMasterService = async (data: BulletTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("BULLET_TYPE_ID", sql.Int, data.BULLET_TYPE_ID ?? 0)
      .input("BULLET_TYPE_NAME", sql.VarChar(100), data.BULLET_TYPE_NAME || null)
      .input("DESCRIPTION", sql.VarChar(200), data.DESCRIPTION || null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_BULLET_TYPE_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save bullet type");

    return { message: message || "Data saved successfully", BULLET_TYPE_ID: savedData };
  } catch (error) {
    console.error("SAVE_BULLET_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const updateBulletTypeMasterService = async (data: BulletTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("BULLET_TYPE_ID", sql.Int, data.BULLET_TYPE_ID ?? 0)
      .input("BULLET_TYPE_NAME", sql.VarChar(100), data.BULLET_TYPE_NAME ?? null)
      .input("DESCRIPTION", sql.VarChar(200), data.DESCRIPTION ?? null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_BULLET_TYPE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update bullet type");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_BULLET_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const deleteBulletTypeMasterService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("BULLET_TYPE_ID", sql.Int, id)
      .execute("VMaster.DELETE_BULLET_TYPE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete bullet type");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_BULLET_TYPE_MASTER SP error:", error);
    throw error;
  }
};