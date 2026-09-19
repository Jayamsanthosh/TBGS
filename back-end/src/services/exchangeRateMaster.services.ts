import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface ExchangeRateMasterData {
  SNO?: number;
  COMPANY_ID: number;
  MONTH_ENTERED: string;
  YEAR_ENTERED: string;
  DATE_OF_EXCHANGE: Date | string;
  FROM_CURRENCY_ID: number;
  TO_CURRENCY_ID: number;
  EXCHANGE_RATE: number;
  REMARKS: string;
  STATUS_MASTER: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllExchangeRateMasterService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .execute("VMaster.SHOW_EXCHANGE_RATE_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_EXCHANGE_RATE_MASTER SP error:", error);
    throw error;
  }
};

export const getExchangeRateMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, id)
      .execute("VMaster.GET_EXCHANGE_RATE_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_EXCHANGE_RATE_MASTER SP error:", error);
    throw error;
  }
};

export const saveExchangeRateMasterService = async (data: ExchangeRateMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, data.SNO ?? 0)
      .input("COMPANY_ID", sql.Int, data.COMPANY_ID)
      .input("MONTH_ENTERED", sql.VarChar(50), data.MONTH_ENTERED || null)
      .input("YEAR_ENTERED", sql.VarChar(20), data.YEAR_ENTERED || null)
      .input("DATE_OF_EXCHANGE", sql.DateTime, data.DATE_OF_EXCHANGE || null)
      .input("FROM_CURRENCY_ID", sql.Int, data.FROM_CURRENCY_ID)
      .input("TO_CURRENCY_ID", sql.Int, data.TO_CURRENCY_ID)
      .input("EXCHANGE_RATE", sql.Decimal(15, 5), data.EXCHANGE_RATE ?? 0)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_EXCHANGE_RATE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to save exchange rate");

    return { message: message || "Exchange rate saved successfully" };
  } catch (error) {
    console.error("SAVE_EXCHANGE_RATE_MASTER SP error:", error);
    throw error;
  }
};

export const updateExchangeRateMasterService = async (data: ExchangeRateMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, data.SNO ?? 0)
      .input("COMPANY_ID", sql.Int, data.COMPANY_ID)
      .input("MONTH_ENTERED", sql.VarChar(50), data.MONTH_ENTERED ?? null)
      .input("YEAR_ENTERED", sql.VarChar(20), data.YEAR_ENTERED ?? null)
      .input("DATE_OF_EXCHANGE", sql.DateTime, data.DATE_OF_EXCHANGE ?? null)
      .input("FROM_CURRENCY_ID", sql.Int, data.FROM_CURRENCY_ID)
      .input("TO_CURRENCY_ID", sql.Int, data.TO_CURRENCY_ID)
      .input("EXCHANGE_RATE", sql.Decimal(15, 5), data.EXCHANGE_RATE ?? 0)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_EXCHANGE_RATE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update exchange rate");

    return { message: message || "Exchange rate updated successfully" };
  } catch (error) {
    console.error("UPDATE_EXCHANGE_RATE_MASTER SP error:", error);
    throw error;
  }
};

export const deleteExchangeRateMasterService = async (
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
      .input("SNO", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_EXCHANGE_RATE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete");

    return { message: message || "Exchange rate deleted successfully" };
  } catch (error) {
    console.error("DELETE_EXCHANGE_RATE_MASTER SP error:", error);
    throw error;
  }
};
