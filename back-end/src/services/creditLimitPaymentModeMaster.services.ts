import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface CreditLimitPaymentModeMasterData {
  PAYMENT_MODE_ID?: number;
  PAYMENT_MODE_NAME: string;
  PAYMENT_MODE_PERCENTAGE?: number;
  REMARKS?: string;
  STATUS_ENTRY: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllCreditLimitPaymentModeMasterService = async (status?: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(50), status ?? "")
      .query(`
        SELECT [PAYMENT_MODE_ID]
              ,[PAYMENT_MODE_NAME]
              ,[PAYMENT_MODE_PERCENTAGE]
              ,[REMARKS]
              ,[STATUS_ENTRY]
        FROM [VMaster].[TBL_CREDIT_LIMIT_PAYMENT_MODE_MASTER]
        WHERE (@STATUS = '' OR @STATUS IS NULL OR STATUS_ENTRY = @STATUS)
        ORDER BY [PAYMENT_MODE_NAME]
      `);
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_CREDIT_LIMIT_PAYMENT_MODE_MASTER query error:", error);
    throw error;
  }
};

export const getCreditLimitPaymentModeMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("PAYMENT_MODE_ID", sql.Int, id)
      .execute("VMaster.GET_CREDIT_LIMIT_PAYMENT_MODE_MASTER");
    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_CREDIT_LIMIT_PAYMENT_MODE_MASTER SP error:", error);
    throw error;
  }
};

export const saveCreditLimitPaymentModeMasterService = async (data: CreditLimitPaymentModeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("PAYMENT_MODE_ID", sql.Int, data.PAYMENT_MODE_ID ?? 0)
      .input("PAYMENT_MODE_NAME", sql.VarChar(200), data.PAYMENT_MODE_NAME || null)
      .input("PAYMENT_MODE_PERCENTAGE", sql.Float, data.PAYMENT_MODE_PERCENTAGE ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_ENTRY", sql.VarChar(50), data.STATUS_ENTRY || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_CREDIT_LIMIT_PAYMENT_MODE_MASTER");
    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to save credit limit payment mode");

    return { message: message || "Credit limit payment mode saved successfully" };
  } catch (error) {
    console.error("SAVE_CREDIT_LIMIT_PAYMENT_MODE_MASTER SP error:", error);
    throw error;
  }
};

export const updateCreditLimitPaymentModeMasterService = async (data: CreditLimitPaymentModeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("PAYMENT_MODE_ID", sql.Int, data.PAYMENT_MODE_ID ?? 0)
      .input("PAYMENT_MODE_NAME", sql.VarChar(200), data.PAYMENT_MODE_NAME ?? null)
      .input("PAYMENT_MODE_PERCENTAGE", sql.Float, data.PAYMENT_MODE_PERCENTAGE ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_ENTRY", sql.VarChar(50), data.STATUS_ENTRY ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_CREDIT_LIMIT_PAYMENT_MODE_MASTER");
    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update credit limit payment mode");

    return { message: message || "Credit limit payment mode updated successfully" };
  } catch (error) {
    console.error("UPDATE_CREDIT_LIMIT_PAYMENT_MODE_MASTER SP error:", error);
    throw error;
  }
};

export const deleteCreditLimitPaymentModeMasterService = async (
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
      .input("PAYMENT_MODE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_CREDIT_LIMIT_PAYMENT_MODE_MASTER");
    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete");

    return { message: message || "Credit limit payment mode deleted successfully" };
  } catch (error) {
    console.error("DELETE_CREDIT_LIMIT_PAYMENT_MODE_MASTER SP error:", error);
    throw error;
  }
};
