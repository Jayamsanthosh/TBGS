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
  LINK_ID?: number | null;
}

const toInt = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

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

export const getPaymentTriggerEventMasterByIdService = async (id: number, linkId?: number | null) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const resolvedLinkId = toInt(linkId) ?? 45;

  try {
    const result = await pool
      .request()
      .input("TRIGGER_EVENT_ID", sql.Int, id)
      .input("LINK_ID", sql.Int, resolvedLinkId)
      .execute("VMaster.GET_PAYMENT_TRIGGER_EVENT_MASTER");

    if (result.recordset?.[0]) {
      return result.recordset[0];
    }

    // Fallback if record exists with different/null link_id
    const fallback = await pool
      .request()
      .input("TRIGGER_EVENT_ID", sql.Int, id)
      .query(`
        SELECT * FROM [VMaster].[TBL_PAYMENT_TRIGGER_EVENT_Master]
        WHERE TRIGGER_EVENT_ID = @TRIGGER_EVENT_ID
      `);

    return fallback.recordset?.[0] || null;
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
      .input("TRIGGER_EVENT_ID", sql.Int, toInt(data.TRIGGER_EVENT_ID) ?? 0)
      .input("TRIGGER_EVENT_CODE", sql.VarChar(20), data.TRIGGER_EVENT_CODE || null)
      .input("TRIGGER_EVENT_NAME", sql.VarChar(100), data.TRIGGER_EVENT_NAME || null)
      .input("DESCRIPTION", sql.VarChar(500), data.DESCRIPTION || null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || "AC")
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .input("LINK_ID", sql.Int, toInt(data.LINK_ID) ?? 45)
      .execute("VMaster.SAVE_PAYMENT_TRIGGER_EVENT_MASTER");

    const { message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save trigger event");

    let newId = toInt(savedData) || toInt(data.TRIGGER_EVENT_ID);
    if (!newId || newId === 0) {
      const idRes = await pool
        .request()
        .input("TRIGGER_EVENT_CODE", sql.VarChar(20), data.TRIGGER_EVENT_CODE)
        .query(
          `SELECT TOP 1 TRIGGER_EVENT_ID FROM [VMaster].[TBL_PAYMENT_TRIGGER_EVENT_Master] WHERE TRIGGER_EVENT_CODE = @TRIGGER_EVENT_CODE ORDER BY TRIGGER_EVENT_ID DESC`
        );
      newId = idRes.recordset?.[0]?.TRIGGER_EVENT_ID;
    }

    return {
      message: message || "Data Saved Successfully",
      TRIGGER_EVENT_ID: newId,
    };
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
      .input("TRIGGER_EVENT_ID", sql.Int, toInt(data.TRIGGER_EVENT_ID) ?? 0)
      .input("TRIGGER_EVENT_CODE", sql.VarChar(20), data.TRIGGER_EVENT_CODE ?? null)
      .input("TRIGGER_EVENT_NAME", sql.VarChar(100), data.TRIGGER_EVENT_NAME ?? null)
      .input("DESCRIPTION", sql.VarChar(500), data.DESCRIPTION ?? null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? "AC")
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .input("LINK_ID", sql.Int, toInt(data.LINK_ID) ?? 45)
      .execute("VMaster.UPDATE_PAYMENT_TRIGGER_EVENT_MASTER");

    const { message, data: updatedId } = parseSprocResult(result.recordset?.[0], "Failed to update trigger event");

    return {
      message: message || "RECORD UPDATED SUCCESSFULL",
      TRIGGER_EVENT_ID: toInt(updatedId) || toInt(data.TRIGGER_EVENT_ID),
    };
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

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to delete trigger event");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    const msg = (error as any)?.message || "";
    if (msg.includes("REFERENCE constraint") || msg.includes("FK_")) {
      throw new Error("Cannot delete: This trigger event has associated records.");
    }
    console.error("DELETE_PAYMENT_TRIGGER_EVENT_MASTER SP error:", error);
    throw error;
  }
};