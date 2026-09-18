import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface ProductSubCategoryData {
  SUB_CATEGORY_ID?: number;
  SUB_CATEGORY_NAME: string;
  MAIN_CATEGORY_ID?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllProductSubCategoryService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .execute("VMaster.SHOW_PRODUCT_SUB_CATEGORY_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_PRODUCT_SUB_CATEGORY_MASTER SP error:", error);
    throw error;
  }
};

export const getProductSubCategoryByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SUB_CATEGORY_ID", sql.Int, id)
      .execute("VMaster.GET_PRODUCT_SUB_CATEGORY_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_PRODUCT_SUB_CATEGORY_MASTER SP error:", error);
    throw error;
  }
};

export const saveProductSubCategoryService = async (data: ProductSubCategoryData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SUB_CATEGORY_ID", sql.Int, data.SUB_CATEGORY_ID ?? 0)
      .input("SUB_CATEGORY_NAME", sql.VarChar(50), data.SUB_CATEGORY_NAME || null)
      .input("MAIN_CATEGORY_ID", sql.Int, data.MAIN_CATEGORY_ID ?? null)
      .input("REMARKS", sql.VarChar(2000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_PRODUCT_SUB_CATEGORY_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to save sub category");

    return { message: message || "Sub category saved successfully" };
  } catch (error) {
    console.error("SAVE_PRODUCT_SUB_CATEGORY_MASTER SP error:", error);
    throw error;
  }
};

export const updateProductSubCategoryService = async (data: ProductSubCategoryData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SUB_CATEGORY_ID", sql.Int, data.SUB_CATEGORY_ID ?? 0)
      .input("SUB_CATEGORY_NAME", sql.VarChar(50), data.SUB_CATEGORY_NAME ?? null)
      .input("MAIN_CATEGORY_ID", sql.Int, data.MAIN_CATEGORY_ID ?? null)
      .input("REMARKS", sql.VarChar(2000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_PRODUCT_SUB_CATEGORY_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update sub category");

    return { message: message || "Sub category updated successfully" };
  } catch (error) {
    console.error("UPDATE_PRODUCT_SUB_CATEGORY_MASTER SP error:", error);
    throw error;
  }
};

export const deleteProductSubCategoryService = async (
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
      .input("SUB_CATEGORY_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_PRODUCT_SUB_CATEGORY_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete sub category");

    return { message: message || "Sub category deleted successfully" };
  } catch (error) {
    console.error("DELETE_PRODUCT_SUB_CATEGORY_MASTER SP error:", error);
    throw error;
  }
};
