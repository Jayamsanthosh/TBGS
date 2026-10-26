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
  LINK_ID?: number | null;
}

const toInt = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

const toDecimal = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

const serializeRecordset = (rows: any[]) =>
  (rows || []).map((r: any) => ({ ...r, id: r.PAYMENT_MODE_ID, LINK_ID: r.LINK_ID ?? 43 }));

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

export const getPaymentModeMasterByIdService = async (id: number, linkId?: number | null) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const resolvedLinkId = toInt(linkId) ?? 43;

  try {
    const result = await pool
      .request()
      .input("PAYMENT_MODE_ID", sql.Int, id)
      .input("LINK_ID", sql.Int, resolvedLinkId)
      .execute("VMaster.GET_PAYMENT_MODE_MASTER");

    if (result.recordset?.[0]) {
      return { ...result.recordset[0], LINK_ID: resolvedLinkId };
    }

    // Fallback if record exists with different/null link_id
    const fallback = await pool
      .request()
      .input("PAYMENT_MODE_ID", sql.Int, id)
      .query(`SELECT * FROM VMaster.TBL_PAYMENT_MODE_MASTER WHERE PAYMENT_MODE_ID = @PAYMENT_MODE_ID`);
    const fallbackRow = fallback.recordset[0] || null;
    return fallbackRow ? { ...fallbackRow, LINK_ID: resolvedLinkId } : null;
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
      .input("PAYMENT_MODE_ID", sql.Int, toInt(data.PAYMENT_MODE_ID) ?? 0)
      .input("PAYMENT_MODE_NAME", sql.VarChar(200), data.PAYMENT_MODE_NAME || null)
      .input("PAYMENT_MODE_PERCENTAGE", sql.Decimal(15, 2), toDecimal(data.PAYMENT_MODE_PERCENTAGE))
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_ENTRY", sql.VarChar(50), data.STATUS_ENTRY || "AC")
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .input("LINK_ID", sql.Int, toInt(data.LINK_ID) ?? 43)
      .execute("VMaster.SAVE_PAYMENT_MODE_MASTER");

    const { message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save payment mode");

    let newId = toInt(savedData) || toInt(data.PAYMENT_MODE_ID);
    if (!newId || newId === 0) {
      const idRes = await pool
        .request()
        .input("PAYMENT_MODE_NAME", sql.VarChar(200), data.PAYMENT_MODE_NAME)
        .query(
          `SELECT TOP 1 PAYMENT_MODE_ID FROM VMaster.TBL_PAYMENT_MODE_MASTER WHERE PAYMENT_MODE_NAME = @PAYMENT_MODE_NAME ORDER BY PAYMENT_MODE_ID DESC`
        );
      newId = idRes.recordset?.[0]?.PAYMENT_MODE_ID;
    }

    return {
      message: message || "Data Saved Successfully",
      PAYMENT_MODE_ID: newId,
    };
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
      .input("PAYMENT_MODE_ID", sql.Int, toInt(data.PAYMENT_MODE_ID) ?? 0)
      .input("PAYMENT_MODE_NAME", sql.VarChar(200), data.PAYMENT_MODE_NAME ?? null)
      .input("PAYMENT_MODE_PERCENTAGE", sql.Decimal(15, 2), toDecimal(data.PAYMENT_MODE_PERCENTAGE))
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_ENTRY", sql.VarChar(50), data.STATUS_ENTRY ?? "AC")
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .input("LINK_ID", sql.Int, toInt(data.LINK_ID) ?? 43)
      .execute("VMaster.UPDATE_PAYMENT_MODE_MASTER");

    const { message, data: updatedId } = parseSprocResult(result.recordset?.[0], "Failed to update payment mode");

    return {
      message: message || "RECORD UPDATED SUCCESSFULL",
      PAYMENT_MODE_ID: toInt(updatedId) || toInt(data.PAYMENT_MODE_ID),
    };
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

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to delete payment mode");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    const msg = (error as any)?.message || "";
    if (msg.includes("REFERENCE constraint") || msg.includes("FK_")) {
      throw new Error("Cannot delete: This payment mode has associated records.");
    }
    console.error("DELETE_PAYMENT_MODE_MASTER SP error:", error);
    throw error;
  }
};