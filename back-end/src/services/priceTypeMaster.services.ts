import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface PriceTypeMasterData {
  PRICE_TYPE_ID?: number;
  PRICE_TYPE_NAME: string;
  PRICE_TYPE_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllPriceTypeMasterService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .execute("VMaster.SHOW_PRICE_TYPE_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_PRICE_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const getPriceTypeMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PRICE_TYPE_ID", sql.Int, id)
      .execute("VMaster.GET_PRICE_TYPE_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_PRICE_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const savePriceTypeMasterService = async (data: PriceTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PRICE_TYPE_ID", sql.Int, data.PRICE_TYPE_ID ?? 0)
      .input("PRICE_TYPE_NAME", sql.VarChar(50), data.PRICE_TYPE_NAME || null)
      .input("PRICE_TYPE_DESCRIPTION", sql.VarChar(50), data.PRICE_TYPE_DESCRIPTION || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_PRICE_TYPE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to save price type");

    return { message: message || "Price type saved successfully" };
  } catch (error) {
    console.error("SAVE_PRICE_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const updatePriceTypeMasterService = async (data: PriceTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PRICE_TYPE_ID", sql.Int, data.PRICE_TYPE_ID ?? 0)
      .input("PRICE_TYPE_NAME", sql.VarChar(50), data.PRICE_TYPE_NAME ?? null)
      .input("PRICE_TYPE_DESCRIPTION", sql.VarChar(50), data.PRICE_TYPE_DESCRIPTION ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_PRICE_TYPE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update price type");

    return { message: message || "Price type updated successfully" };
  } catch (error) {
    console.error("UPDATE_PRICE_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const deletePriceTypeMasterService = async (
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
      .input("PRICE_TYPE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_PRICE_TYPE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete");

    return { message: message || "Price type deleted successfully" };
  } catch (error) {
    console.error("DELETE_PRICE_TYPE_MASTER SP error:", error);
    throw error;
  }
};
