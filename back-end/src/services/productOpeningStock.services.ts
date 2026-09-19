import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

const normalizeStatus = (status: string | undefined | null): string => {
  if (!status) return 'AC';
  const s = status.trim().toUpperCase();
  if (s === 'ACTIVE' || s === 'AC') return 'AC';
  if (s === 'INACTIVE' || s === 'IN') return 'IN';
  return s.substring(0, 2);
};

export interface ProductOpeningStockData {
  SNO?: number;
  OPENING_STOCK_DATE: string;
  COMPANY_ID: number;
  CAMP_ID: number;
  STORE_ID: number;
  MAIN_CATEGORY_ID: number;
  SUB_CATEGORY_ID: number;
  PRODUCT_ID: number;
  QTY: number;
  APPROVED_BY?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
}

export const getAllProductOpeningStockService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .execute("VMaster.SHOW_PRODUCT_OPENING_STOCK");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_PRODUCT_OPENING_STOCK SP error:", error);
    throw error;
  }
};

export const getProductOpeningStockByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, id)
      .execute("VMaster.GET_PRODUCT_OPENING_STOCK");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_PRODUCT_OPENING_STOCK SP error:", error);
    throw error;
  }
};

export const saveProductOpeningStockService = async (data: ProductOpeningStockData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, data.SNO ?? 0)
      .input("OPENING_STOCK_DATE", sql.DateTime, data.OPENING_STOCK_DATE || null)
      .input("COMPANY_ID", sql.Int, data.COMPANY_ID ?? null)
      .input("CAMP_ID", sql.Int, data.CAMP_ID ?? null)
      .input("STORE_ID", sql.Int, data.STORE_ID ?? null)
      .input("MAIN_CATEGORY_ID", sql.Int, data.MAIN_CATEGORY_ID ?? null)
      .input("SUB_CATEGORY_ID", sql.Int, data.SUB_CATEGORY_ID ?? null)
      .input("PRODUCT_ID", sql.Int, data.PRODUCT_ID ?? null)
      .input("QTY", sql.Decimal(15, 2), data.QTY ?? null)
      .input("APPROVED_BY", sql.VarChar(50), data.APPROVED_BY || null)
      .input("REMARKS", sql.VarChar(2000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), normalizeStatus(data.STATUS_MASTER))
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_PRODUCT_OPENING_STOCK");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save product opening stock");

    return { message: message || "Data saved successfully", SNO: savedData };
  } catch (error) {
    console.error("SAVE_PRODUCT_OPENING_STOCK SP error:", error);
    throw error;
  }
};

export const updateProductOpeningStockService = async (data: ProductOpeningStockData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, data.SNO ?? 0)
      .input("OPENING_STOCK_DATE", sql.DateTime, data.OPENING_STOCK_DATE || null)
      .input("COMPANY_ID", sql.Int, data.COMPANY_ID ?? null)
      .input("CAMP_ID", sql.Int, data.CAMP_ID ?? null)
      .input("STORE_ID", sql.Int, data.STORE_ID ?? null)
      .input("MAIN_CATEGORY_ID", sql.Int, data.MAIN_CATEGORY_ID ?? null)
      .input("SUB_CATEGORY_ID", sql.Int, data.SUB_CATEGORY_ID ?? null)
      .input("PRODUCT_ID", sql.Int, data.PRODUCT_ID ?? null)
      .input("QTY", sql.Decimal(15, 2), data.QTY ?? null)
      .input("APPROVED_BY", sql.VarChar(50), data.APPROVED_BY || null)
      .input("REMARKS", sql.VarChar(2000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), normalizeStatus(data.STATUS_MASTER))
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.UPDATE_PRODUCT_OPENING_STOCK");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to update product opening stock");

    return { message: message || "Record updated successfully", SNO: savedData };
  } catch (error) {
    console.error("UPDATE_PRODUCT_OPENING_STOCK SP error:", error);
    throw error;
  }
};

export const deleteProductOpeningStockService = async (id: number, user = "Admin", role = "Admin", macAddress = "WEB") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, id)
      .input("USER", sql.VarChar(50), user)
      .input("ROLE", sql.VarChar(50), role)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VMaster.DELETE_PRODUCT_OPENING_STOCK");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to delete product opening stock");

    return { message: message || "Record deleted successfully", SNO: savedData };
  } catch (error) {
    console.error("DELETE_PRODUCT_OPENING_STOCK SP error:", error);
    throw error;
  }
};