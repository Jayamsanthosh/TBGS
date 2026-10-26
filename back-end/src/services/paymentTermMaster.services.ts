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
  LINK_ID?: number | null;
}

const toInt = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

const toDecimal = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

const normalizeRow = (r: any) => ({
  ...r,
  STATUS_MASTER: r.STATUS_MASTER ?? r.STATUS ?? null,
  LINK_ID: r.LINK_ID ?? 101,
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

export const getPaymentTermMasterByIdService = async (id: number, linkId?: number | null) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const resolvedLinkId = toInt(linkId) ?? 101;

  try {
    const result = await pool
      .request()
      .input("PAYMENT_TERM_ID", sql.Int, id)
      .input("LINK_ID", sql.Int, resolvedLinkId)
      .execute("VMaster.GET_PAYMENT_TERM_MASTER");

    const row = result.recordset[0] || null;
    if (row) return normalizeRow(row);

    // Fallback if record exists with different/null link_id
    const fallback = await pool
      .request()
      .input("PAYMENT_TERM_ID", sql.Int, id)
      .query(`SELECT * FROM VMaster.TBL_PAYMENT_TERM_MASTER WHERE PAYMENT_TERM_ID = @PAYMENT_TERM_ID`);
    const fallbackRow = fallback.recordset[0] || null;
    return fallbackRow ? normalizeRow(fallbackRow) : null;
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
      .input("TRIGGER_EVENT_ID", sql.Int, toInt(data.TRIGGER_EVENT_ID))
      .input("DUE_DATE_CALCULATION", sql.VarChar(20), data.DUE_DATE_CALCULATION || null)
      .input("NO_OF_DAYS", sql.Int, toInt(data.NO_OF_DAYS))
      .input("DOWN_PAYMENT_PERCENTAGE", sql.Decimal(18, 2), toDecimal(data.DOWN_PAYMENT_PERCENTAGE))
      .input("BALANCE_PAYMENT_PERCENTAGE", sql.Decimal(18, 2), toDecimal(data.BALANCE_PAYMENT_PERCENTAGE))
      .input("INSTALLMENT_ALLOWED", sql.VarChar(10), data.INSTALLMENT_ALLOWED || "NO")
      .input("NO_OF_INSTALLMENTS", sql.Int, toInt(data.NO_OF_INSTALLMENTS))
      .input("INTEREST_RATE", sql.Decimal(18, 2), toDecimal(data.INTEREST_RATE))
      .input("GRACE_PERIOD_DAYS", sql.Int, toInt(data.GRACE_PERIOD_DAYS))
      .input("DESCRIPTION", sql.VarChar(500), data.DESCRIPTION || null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || "AC")
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .input("LINK_ID", sql.Int, toInt(data.LINK_ID) ?? 101)
      .execute("VMaster.SAVE_PAYMENT_TERM_MASTER");

    const { message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save payment term");

    let newId = toInt(result.output?.PAYMENT_TERM_ID) || toInt(savedData) || toInt(data.PAYMENT_TERM_ID);
    if (!newId || newId === 0) {
      const idRes = await pool
        .request()
        .input("PAYMENT_TERM_CODE", sql.VarChar(20), data.PAYMENT_TERM_CODE)
        .query(
          `SELECT TOP 1 PAYMENT_TERM_ID FROM VMaster.TBL_PAYMENT_TERM_MASTER WHERE PAYMENT_TERM_CODE = @PAYMENT_TERM_CODE ORDER BY PAYMENT_TERM_ID DESC`
        );
      newId = idRes.recordset?.[0]?.PAYMENT_TERM_ID;
    }

    return {
      message: message || "DATA SAVED SUCCESSFULLY",
      PAYMENT_TERM_ID: newId,
    };
  } catch (error) {
    console.error("SAVE_PAYMENT_TERM_MASTER SP error:", error);
    throw error;
  }
};

export const updatePaymentTermMasterService = async (data: PaymentTermMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PAYMENT_TERM_ID", sql.Int, toInt(data.PAYMENT_TERM_ID) ?? 0)
      .input("PAYMENT_TERM_CODE", sql.VarChar(20), data.PAYMENT_TERM_CODE ?? null)
      .input("PAYMENT_TERM_NAME", sql.VarChar(150), data.PAYMENT_TERM_NAME ?? null)
      .input("TRIGGER_EVENT_ID", sql.Int, toInt(data.TRIGGER_EVENT_ID))
      .input("DUE_DATE_CALCULATION", sql.VarChar(20), data.DUE_DATE_CALCULATION ?? null)
      .input("NO_OF_DAYS", sql.Int, toInt(data.NO_OF_DAYS))
      .input("DOWN_PAYMENT_PERCENTAGE", sql.Decimal(18, 2), toDecimal(data.DOWN_PAYMENT_PERCENTAGE))
      .input("BALANCE_PAYMENT_PERCENTAGE", sql.Decimal(18, 2), toDecimal(data.BALANCE_PAYMENT_PERCENTAGE))
      .input("INSTALLMENT_ALLOWED", sql.VarChar(10), data.INSTALLMENT_ALLOWED ?? "NO")
      .input("NO_OF_INSTALLMENTS", sql.Int, toInt(data.NO_OF_INSTALLMENTS))
      .input("INTEREST_RATE", sql.Decimal(18, 2), toDecimal(data.INTEREST_RATE))
      .input("GRACE_PERIOD_DAYS", sql.Int, toInt(data.GRACE_PERIOD_DAYS))
      .input("DESCRIPTION", sql.VarChar(500), data.DESCRIPTION ?? null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? "AC")
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .input("LINK_ID", sql.Int, toInt(data.LINK_ID) ?? 101)
      .execute("VMaster.UPDATE_PAYMENT_TERM_MASTER");

    const { message, data: updatedId } = parseSprocResult(result.recordset?.[0], "Failed to update payment term");

    return {
      message: message || "RECORD UPDATED SUCCESSFULLY",
      PAYMENT_TERM_ID: toInt(updatedId) || toInt(data.PAYMENT_TERM_ID),
    };
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

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to delete payment term");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    const msg = (error as any)?.message || "";
    if (msg.includes("REFERENCE constraint") || msg.includes("FK_")) {
      throw new Error("Cannot delete: This payment term has associated records.");
    }
    console.error("DELETE_PAYMENT_TERM_MASTER SP error:", error);
    throw error;
  }
};