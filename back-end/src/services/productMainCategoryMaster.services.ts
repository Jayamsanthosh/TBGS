import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface ProductMainCategoryData {
  MAIN_CATEGORY_ID?: number;
  MAIN_CATEGORY_NAME: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllProductMainCategoryService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .execute("VMaster.SHOW_PRODUCT_MAIN_CATEGORY_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_PRODUCT_MAIN_CATEGORY_MASTER SP error:", error);
    throw error;
  }
};

export const getProductMainCategoryByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("MAIN_CATEGORY_ID", sql.Int, id)
      .execute("VMaster.GET_PRODUCT_MAIN_CATEGORY_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_PRODUCT_MAIN_CATEGORY_MASTER SP error:", error);
    throw error;
  }
};

export const saveProductMainCategoryService = async (data: ProductMainCategoryData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("MAIN_CATEGORY_ID", sql.Int, data.MAIN_CATEGORY_ID ?? 0)
      .input("MAIN_CATEGORY_NAME", sql.VarChar(100), data.MAIN_CATEGORY_NAME || null)
      .input("REMARKS", sql.VarChar(2000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_PRODUCT_MAIN_CATEGORY_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to save main category");

    return { message: message || "Main category saved successfully" };
  } catch (error) {
    console.error("SAVE_PRODUCT_MAIN_CATEGORY_MASTER SP error:", error);
    throw error;
  }
};

export const updateProductMainCategoryService = async (data: ProductMainCategoryData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("MAIN_CATEGORY_ID", sql.Int, data.MAIN_CATEGORY_ID ?? 0)
      .input("MAIN_CATEGORY_NAME", sql.VarChar(100), data.MAIN_CATEGORY_NAME ?? null)
      .input("REMARKS", sql.VarChar(2000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_PRODUCT_MAIN_CATEGORY_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update main category");

    return { message: message || "Main category updated successfully" };
  } catch (error) {
    console.error("UPDATE_PRODUCT_MAIN_CATEGORY_MASTER SP error:", error);
    throw error;
  }
};

export const deleteProductMainCategoryService = async (
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
      .input("MAIN_CATEGORY_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_PRODUCT_MAIN_CATEGORY_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete main category");

    return { message: message || "Main category deleted successfully" };
  } catch (error) {
    console.error("DELETE_PRODUCT_MAIN_CATEGORY_MASTER SP error:", error);
    throw error;
  }
};
