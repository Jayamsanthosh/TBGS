import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface PaymentTriggerEventMasterData {
  TRIGGER_EVENT_ID?: number;
  TRIGGER_EVENT_CODE?: string;
  TRIGGER_EVENT_NAME?: string;
  DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const serializeRecordset = (rows: any[]) =>
  (rows || []).map((r: any) => ({ ...r, id: r.TRIGGER_EVENT_ID }));

export const getAllPaymentTriggerEventMasterService = async (status?: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .execute("VMaster.SHOW_PAYMENT_TRIGGER_EVENT_MASTER");

    let rows: any[] = result.recordset || [];

    if (status && status !== "ALL") {
      const s = status.toUpperCase();
      rows = rows.filter((r: any) => {
        const st = (r.STATUS_MASTER || "").toUpperCase();
        return st === s || (s === "AC" && st === "ACTIVE") || (s === "IA" && st === "INACTIVE");
      });
    }

    return serializeRecordset(rows);
  } catch (error) {
    console.error("SHOW_PAYMENT_TRIGGER_EVENT_MASTER SP error:", error);
    throw error;
  }
};

export const getPaymentTriggerEventMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("TRIGGER_EVENT_ID", sql.Int, id)
      .execute("VMaster.GET_PAYMENT_TRIGGER_EVENT_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_PAYMENT_TRIGGER_EVENT_MASTER SP error:", error);
    throw error;
  }
};

export const savePaymentTriggerEventMasterService = async (data: PaymentTriggerEventMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("TRIGGER_EVENT_ID", sql.Int, data.TRIGGER_EVENT_ID ?? 0)
      .input("TRIGGER_EVENT_CODE", sql.VarChar(20), data.TRIGGER_EVENT_CODE || null)
      .input("TRIGGER_EVENT_NAME", sql.VarChar(100), data.TRIGGER_EVENT_NAME || null)
      .input("DESCRIPTION", sql.VarChar(500), data.DESCRIPTION || null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_PAYMENT_TRIGGER_EVENT_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save trigger event");

    return { message: message || "Data saved successfully", TRIGGER_EVENT_ID: savedData };
  } catch (error) {
    console.error("SAVE_PAYMENT_TRIGGER_EVENT_MASTER SP error:", error);
    throw error;
  }
};

export const updatePaymentTriggerEventMasterService = async (data: PaymentTriggerEventMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("TRIGGER_EVENT_ID", sql.Int, data.TRIGGER_EVENT_ID ?? 0)
      .input("TRIGGER_EVENT_CODE", sql.VarChar(20), data.TRIGGER_EVENT_CODE ?? null)
      .input("TRIGGER_EVENT_NAME", sql.VarChar(100), data.TRIGGER_EVENT_NAME ?? null)
      .input("DESCRIPTION", sql.VarChar(500), data.DESCRIPTION ?? null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_PAYMENT_TRIGGER_EVENT_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update trigger event");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_PAYMENT_TRIGGER_EVENT_MASTER SP error:", error);
    throw error;
  }
};

export const deletePaymentTriggerEventMasterService = async (
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
      .input("TRIGGER_EVENT_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_PAYMENT_TRIGGER_EVENT_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete trigger event");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    const msg = (error as any)?.message || "";
    if (msg.includes("REFERENCE constraint") || msg.includes("FK_")) {
      throw new Error("Cannot delete: This trigger event has associated records.");
    }
    throw error;
  }
};