import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface PaymentTermMasterData {
  PAYMENT_TERM_ID?: number;
  PAYMENT_TERM_CODE: string;
  PAYMENT_TERM_NAME: string;
  TRIGGER_EVENT_ID?: number;
  DUE_DATE_CALCULATION?: string;
  NO_OF_DAYS?: number;
  DOWN_PAYMENT_PERCENTAGE?: number;
  BALANCE_PAYMENT_PERCENTAGE?: number;
  INSTALLMENT_ALLOWED?: string;
  NO_OF_INSTALLMENTS?: number;
  INTEREST_RATE?: number;
  GRACE_PERIOD_DAYS?: number;
  DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const normalizeRow = (r: any) => ({
  ...r,
  STATUS_MASTER: r.STATUS_MASTER ?? r.STATUS ?? null,
});

export const getAllPaymentTermMasterService = async (status = "ALL") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    if (status === "ALL") {
      const statuses = ["AC", "IN"];
      let allRows: any[] = [];
      for (const s of statuses) {
        const result = await pool
          .request()
          .input("STATUS", sql.VarChar(20), s)
          .execute("VMaster.SHOW_PAYMENT_TERM_MASTER");
        allRows = allRows.concat(result.recordset || []);
      }
      return allRows.map(normalizeRow);
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(20), status)
      .execute("VMaster.SHOW_PAYMENT_TERM_MASTER");
    return (result.recordset || []).map(normalizeRow);
  } catch (error) {
    console.error("SHOW_PAYMENT_TERM_MASTER SP error:", error);
    throw error;
  }
};

export const getPaymentTermMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PAYMENT_TERM_ID", sql.Int, id)
      .execute("VMaster.GET_PAYMENT_TERM_MASTER");

    const row = result.recordset[0] || null;
    return row ? normalizeRow(row) : null;
  } catch (error) {
    console.error("GET_PAYMENT_TERM_MASTER SP error:", error);
    throw error;
  }
};

export const savePaymentTermMasterService = async (data: PaymentTermMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .output("PAYMENT_TERM_ID", sql.Int)
      .input("PAYMENT_TERM_CODE", sql.VarChar(20), data.PAYMENT_TERM_CODE || null)
      .input("PAYMENT_TERM_NAME", sql.VarChar(150), data.PAYMENT_TERM_NAME || null)
      .input("TRIGGER_EVENT_ID", sql.Int, data.TRIGGER_EVENT_ID ?? null)
      .input("DUE_DATE_CALCULATION", sql.VarChar(20), data.DUE_DATE_CALCULATION || null)
      .input("NO_OF_DAYS", sql.Int, data.NO_OF_DAYS ?? null)
      .input("DOWN_PAYMENT_PERCENTAGE", sql.Decimal(18, 2), data.DOWN_PAYMENT_PERCENTAGE ?? null)
      .input("BALANCE_PAYMENT_PERCENTAGE", sql.Decimal(18, 2), data.BALANCE_PAYMENT_PERCENTAGE ?? null)
      .input("INSTALLMENT_ALLOWED", sql.VarChar(10), data.INSTALLMENT_ALLOWED || null)
      .input("NO_OF_INSTALLMENTS", sql.Int, data.NO_OF_INSTALLMENTS ?? null)
      .input("INTEREST_RATE", sql.Decimal(18, 2), data.INTEREST_RATE ?? null)
      .input("GRACE_PERIOD_DAYS", sql.Int, data.GRACE_PERIOD_DAYS ?? null)
      .input("DESCRIPTION", sql.VarChar(500), data.DESCRIPTION || null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_PAYMENT_TERM_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save payment term");

    const newId = result.output?.PAYMENT_TERM_ID ?? savedData;
    return { message: message || "Data saved successfully", PAYMENT_TERM_ID: newId };
  } catch (error) {
    console.error("SAVE_PAYMENT_TERM_MASTER SP error:", error);
    throw error;
  }
};

export const updatePaymentTermMasterService = async (data: PaymentTermMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const existing = await getPaymentTermMasterByIdService(data.PAYMENT_TERM_ID ?? 0);
    if (!existing) {
      throw new Error("RECORD DOES NOT EXIST");
    }

    const result = await pool
      .request()
      .input("PAYMENT_TERM_ID", sql.Int, data.PAYMENT_TERM_ID ?? 0)
      .input("PAYMENT_TERM_CODE", sql.VarChar(20), data.PAYMENT_TERM_CODE ?? null)
      .input("PAYMENT_TERM_NAME", sql.VarChar(150), data.PAYMENT_TERM_NAME ?? null)
      .input("TRIGGER_EVENT_ID", sql.Int, data.TRIGGER_EVENT_ID ?? null)
      .input("DUE_DATE_CALCULATION", sql.VarChar(20), data.DUE_DATE_CALCULATION ?? null)
      .input("NO_OF_DAYS", sql.Int, data.NO_OF_DAYS ?? null)
      .input("DOWN_PAYMENT_PERCENTAGE", sql.Decimal(18, 2), data.DOWN_PAYMENT_PERCENTAGE ?? null)
      .input("BALANCE_PAYMENT_PERCENTAGE", sql.Decimal(18, 2), data.BALANCE_PAYMENT_PERCENTAGE ?? null)
      .input("INSTALLMENT_ALLOWED", sql.VarChar(10), data.INSTALLMENT_ALLOWED ?? null)
      .input("NO_OF_INSTALLMENTS", sql.Int, data.NO_OF_INSTALLMENTS ?? null)
      .input("INTEREST_RATE", sql.Decimal(18, 2), data.INTEREST_RATE ?? null)
      .input("GRACE_PERIOD_DAYS", sql.Int, data.GRACE_PERIOD_DAYS ?? null)
      .input("DESCRIPTION", sql.VarChar(500), data.DESCRIPTION ?? null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_PAYMENT_TERM_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update payment term");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_PAYMENT_TERM_MASTER SP error:", error);
    throw error;
  }
};

export const deletePaymentTermMasterService = async (
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
      .input("PAYMENT_TERM_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_PAYMENT_TERM_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete payment term");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_PAYMENT_TERM_MASTER SP error:", error);
    throw error;
  }
};