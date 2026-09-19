import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface StoreProductMinimumStockData {
  SNO?: number;
  COMPANY_ID?: number;
  CAMP_ID?: number;
  STORE_ID?: number;
  MAIN_CATEGORY_ID?: number;
  SUB_CATEGORY_ID?: number;
  PRODUCT_ID?: number;
  MINIMUM_STOCK_PCS?: number;
  PURCHASE_ALERT_QTY?: number;
  REQUESTED_BY?: string;
  EFFECTIVE_FROM?: string;
  EFFECTIVE_TO?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const serializeRecordset = (rows: any[]) =>
  (rows || []).map((r: any) => ({ ...r, id: r.SNO }));

export const getAllStoreProductMinimumStockService = async (status?: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    if (status === "ALL" || !status) {
      const statuses = ["AC", "IA"];
      let allRows: any[] = [];
      for (const s of statuses) {
        const result = await pool
          .request()
          .input("STATUS", sql.VarChar(20), s)
          .execute("VMaster.SHOW_STORE_PRODUCT_MINIMUM_STOCK");
        allRows = allRows.concat(result.recordset || []);
      }
      return serializeRecordset(allRows);
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(20), status)
      .execute("VMaster.SHOW_STORE_PRODUCT_MINIMUM_STOCK");
    return serializeRecordset(result.recordset || []);
  } catch (error) {
    console.error("SHOW_STORE_PRODUCT_MINIMUM_STOCK SP error:", error);
    throw error;
  }
};

export const getStoreProductMinimumStockByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, id)
      .execute("VMaster.GET_STORE_PRODUCT_MINIMUM_STOCK");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_STORE_PRODUCT_MINIMUM_STOCK SP error:", error);
    throw error;
  }
};

export const saveStoreProductMinimumStockService = async (data: StoreProductMinimumStockData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, data.SNO ?? 0)
      .input("COMPANY_ID", sql.Int, data.COMPANY_ID ?? 0)
      .input("CAMP_ID", sql.Int, data.CAMP_ID ?? 0)
      .input("STORE_ID", sql.Int, data.STORE_ID ?? 0)
      .input("MAIN_CATEGORY_ID", sql.Int, data.MAIN_CATEGORY_ID ?? 0)
      .input("SUB_CATEGORY_ID", sql.Int, data.SUB_CATEGORY_ID ?? 0)
      .input("PRODUCT_ID", sql.Int, data.PRODUCT_ID ?? 0)
      .input("MINIMUM_STOCK_PCS", sql.Int, data.MINIMUM_STOCK_PCS ?? 0)
      .input("PURCHASE_ALERT_QTY", sql.Decimal(15, 2), data.PURCHASE_ALERT_QTY ?? 0)
      .input("REQUESTED_BY", sql.VarChar(50), data.REQUESTED_BY || null)
      .input("EFFECTIVE_FROM", sql.DateTime, data.EFFECTIVE_FROM || null)
      .input("EFFECTIVE_TO", sql.DateTime, data.EFFECTIVE_TO || null)
      .input("REMARKS", sql.VarChar(2000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_STORE_PRODUCT_MINIMUM_STOCK");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save minimum stock");

    return { message: message || "Data saved successfully", SNO: savedData };
  } catch (error) {
    console.error("SAVE_STORE_PRODUCT_MINIMUM_STOCK SP error:", error);
    throw error;
  }
};

export const updateStoreProductMinimumStockService = async (data: StoreProductMinimumStockData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, data.SNO ?? 0)
      .input("COMPANY_ID", sql.Int, data.COMPANY_ID ?? 0)
      .input("CAMP_ID", sql.Int, data.CAMP_ID ?? 0)
      .input("STORE_ID", sql.Int, data.STORE_ID ?? 0)
      .input("MAIN_CATEGORY_ID", sql.Int, data.MAIN_CATEGORY_ID ?? 0)
      .input("SUB_CATEGORY_ID", sql.Int, data.SUB_CATEGORY_ID ?? 0)
      .input("PRODUCT_ID", sql.Int, data.PRODUCT_ID ?? 0)
      .input("MINIMUM_STOCK_PCS", sql.Int, data.MINIMUM_STOCK_PCS ?? 0)
      .input("PURCHASE_ALERT_QTY", sql.Decimal(15, 2), data.PURCHASE_ALERT_QTY ?? 0)
      .input("REQUESTED_BY", sql.VarChar(50), data.REQUESTED_BY ?? null)
      .input("EFFECTIVE_FROM", sql.DateTime, data.EFFECTIVE_FROM || null)
      .input("EFFECTIVE_TO", sql.DateTime, data.EFFECTIVE_TO || null)
      .input("REMARKS", sql.VarChar(2000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_STORE_PRODUCT_MINIMUM_STOCK");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update minimum stock");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_STORE_PRODUCT_MINIMUM_STOCK SP error:", error);
    throw error;
  }
};

export const deleteStoreProductMinimumStockService = async (
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
      .execute("VMaster.DELETE_STORE_PRODUCT_MINIMUM_STOCK");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete minimum stock");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    throw error;
  }
};