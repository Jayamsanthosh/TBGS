import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface PaymentModeMasterData {
  PAYMENT_MODE_ID?: number;
  PAYMENT_MODE_NAME?: string;
  PAYMENT_MODE_PERCENTAGE?: number;
  REMARKS?: string;
  STATUS_ENTRY?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const serializeRecordset = (rows: any[]) =>
  (rows || []).map((r: any) => ({ ...r, id: r.PAYMENT_MODE_ID }));

export const getAllPaymentModeMasterService = async (status?: string) => {
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
          .execute("VMaster.SHOW_PAYMENT_MODE_MASTER");
        allRows = allRows.concat(result.recordset || []);
      }
      return serializeRecordset(allRows);
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(50), status)
      .execute("VMaster.SHOW_PAYMENT_MODE_MASTER");
    return serializeRecordset(result.recordset || []);
  } catch (error) {
    console.error("SHOW_PAYMENT_MODE_MASTER SP error:", error);
    throw error;
  }
};

export const getPaymentModeMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PAYMENT_MODE_ID", sql.Int, id)
      .execute("VMaster.GET_PAYMENT_MODE_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_PAYMENT_MODE_MASTER SP error:", error);
    throw error;
  }
};

export const savePaymentModeMasterService = async (data: PaymentModeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PAYMENT_MODE_ID", sql.Int, data.PAYMENT_MODE_ID ?? 0)
      .input("PAYMENT_MODE_NAME", sql.VarChar(200), data.PAYMENT_MODE_NAME || null)
      .input("PAYMENT_MODE_PERCENTAGE", sql.Decimal(15, 2), data.PAYMENT_MODE_PERCENTAGE ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_ENTRY", sql.VarChar(50), data.STATUS_ENTRY || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_PAYMENT_MODE_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save payment mode");

    return { message: message || "Data saved successfully", PAYMENT_MODE_ID: savedData };
  } catch (error) {
    console.error("SAVE_PAYMENT_MODE_MASTER SP error:", error);
    throw error;
  }
};

export const updatePaymentModeMasterService = async (data: PaymentModeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PAYMENT_MODE_ID", sql.Int, data.PAYMENT_MODE_ID ?? 0)
      .input("PAYMENT_MODE_NAME", sql.VarChar(200), data.PAYMENT_MODE_NAME ?? null)
      .input("PAYMENT_MODE_PERCENTAGE", sql.Decimal(15, 2), data.PAYMENT_MODE_PERCENTAGE ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_ENTRY", sql.VarChar(50), data.STATUS_ENTRY ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_PAYMENT_MODE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update payment mode");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_PAYMENT_MODE_MASTER SP error:", error);
    throw error;
  }
};

export const deletePaymentModeMasterService = async (
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
      .execute("VMaster.DELETE_PAYMENT_MODE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete payment mode");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    const msg = (error as any)?.message || "";
    if (msg.includes("REFERENCE constraint") || msg.includes("FK_")) {
      throw new Error("Cannot delete: This payment mode has associated records.");
    }
    throw error;
  }
};