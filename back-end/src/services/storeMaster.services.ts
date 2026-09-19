import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface StoreMasterData {
  STORE_ID?: number;
  STORE_NAME: string;
  STORE_SHORT_NAME?: string;
  CAMP_ID?: number;
  MANAGER_NAME?: string;
  STORE_SHORT_CODE?: string;
  EMAIL_ADDRESS?: string;
  CC_EMAIL_ADDRESS?: string;
  BCC_EMAIL_ADDRESS?: string;
  RESPONSE_DIRECTORS_NAME?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllStoreMasterService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .execute("VMaster.SHOW_STORE_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_STORE_MASTER SP error:", error);
    throw error;
  }
};

export const getStoreMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("STORE_ID", sql.Int, id)
      .execute("VMaster.GET_STORE_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_STORE_MASTER SP error:", error);
    throw error;
  }
};

export const saveStoreMasterService = async (data: StoreMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("STORE_ID", sql.Int, data.STORE_ID ?? 0)
      .input("STORE_NAME", sql.VarChar(100), data.STORE_NAME || null)
      .input("STORE_SHORT_NAME", sql.VarChar(50), data.STORE_SHORT_NAME || null)
      .input("CAMP_ID", sql.Int, data.CAMP_ID ?? null)
      .input("MANAGER_NAME", sql.VarChar(50), data.MANAGER_NAME || null)
      .input("STORE_SHORT_CODE", sql.VarChar(5), data.STORE_SHORT_CODE || null)
      .input("EMAIL_ADDRESS", sql.VarChar(1000), data.EMAIL_ADDRESS || null)
      .input("CC_EMAIL_ADDRESS", sql.VarChar(sql.MAX), data.CC_EMAIL_ADDRESS || null)
      .input("BCC_EMAIL_ADDRESS", sql.VarChar(50), data.BCC_EMAIL_ADDRESS || null)
      .input("RESPONSE_DIRECTORS_NAME", sql.VarChar(1000), data.RESPONSE_DIRECTORS_NAME || null)
      .input("REMARKS", sql.VarChar(2000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_STORE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to save store");

    return { message: message || "Store saved successfully" };
  } catch (error) {
    console.error("SAVE_STORE_MASTER SP error:", error);
    throw error;
  }
};

export const updateStoreMasterService = async (data: StoreMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("STORE_ID", sql.Int, data.STORE_ID ?? 0)
      .input("STORE_NAME", sql.VarChar(100), data.STORE_NAME ?? null)
      .input("STORE_SHORT_NAME", sql.VarChar(50), data.STORE_SHORT_NAME ?? null)
      .input("CAMP_ID", sql.Int, data.CAMP_ID ?? null)
      .input("MANAGER_NAME", sql.VarChar(50), data.MANAGER_NAME ?? null)
      .input("STORE_SHORT_CODE", sql.VarChar(5), data.STORE_SHORT_CODE ?? null)
      .input("EMAIL_ADDRESS", sql.VarChar(1000), data.EMAIL_ADDRESS ?? null)
      .input("CC_EMAIL_ADDRESS", sql.VarChar(sql.MAX), data.CC_EMAIL_ADDRESS ?? null)
      .input("BCC_EMAIL_ADDRESS", sql.VarChar(50), data.BCC_EMAIL_ADDRESS ?? null)
      .input("RESPONSE_DIRECTORS_NAME", sql.VarChar(1000), data.RESPONSE_DIRECTORS_NAME ?? null)
      .input("REMARKS", sql.VarChar(2000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_STORE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update store");

    return { message: message || "Store updated successfully" };
  } catch (error) {
    console.error("UPDATE_STORE_MASTER SP error:", error);
    throw error;
  }
};

export const deleteStoreMasterService = async (
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
      .input("STORE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_STORE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete store");

    return { message: message || "Store deleted successfully" };
  } catch (error) {
    console.error("DELETE_STORE_MASTER SP error:", error);
    throw error;
  }
};
