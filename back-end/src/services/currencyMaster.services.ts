import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface CurrencyMasterData {
  CURRENCY_ID?: number;
  CURRENCY_NAME: string;
  ADDRESS: string;
  Exchange_Rate: number;
  REMARKS: string;
  STATUS_MASTER: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllCurrencyMasterService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .execute("VMaster.SHOW_CURRENCY_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_CURRENCY_MASTER SP error:", error);
    throw error;
  }
};

export const getCurrencyMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("CURRENCY_ID", sql.Int, id)
      .execute("VMaster.GET_CURRENCY_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_CURRENCY_MASTER SP error:", error);
    throw error;
  }
};

export const saveCurrencyMasterService = async (data: CurrencyMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("CURRENCY_ID", sql.Int, data.CURRENCY_ID ?? 0)
      .input("CURRENCY_NAME", sql.VarChar(50), data.CURRENCY_NAME || null)
      .input("ADDRESS", sql.VarChar(50), data.ADDRESS || null)
      .input("EXCHANGE_RATE", sql.Decimal(15, 5), data.Exchange_Rate ?? 0)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_CURRENCY_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to save currency");

    return { message: message || "Currency saved successfully" };
  } catch (error) {
    console.error("SAVE_CURRENCY_MASTER SP error:", error);
    throw error;
  }
};

export const updateCurrencyMasterService = async (data: CurrencyMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("CURRENCY_ID", sql.Int, data.CURRENCY_ID ?? 0)
      .input("CURRENCY_NAME", sql.VarChar(50), data.CURRENCY_NAME ?? null)
      .input("ADDRESS", sql.VarChar(50), data.ADDRESS ?? null)
      .input("EXCHANGE_RATE", sql.Decimal(15, 5), data.Exchange_Rate ?? 0)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_CURRENCY_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update currency");

    return { message: message || "Currency updated successfully" };
  } catch (error) {
    console.error("UPDATE_CURRENCY_MASTER SP error:", error);
    throw error;
  }
};

export const deleteCurrencyMasterService = async (
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
      .input("CURRENCY_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_CURRENCY_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete");

    return { message: message || "Currency deleted successfully" };
  } catch (error) {
    console.error("DELETE_CURRENCY_MASTER SP error:", error);
    throw error;
  }
};
