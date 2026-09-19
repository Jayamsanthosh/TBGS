import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface ProductMasterData {
  PRODUCT_ID?: number;
  PRODUCT_NAME: string;
  TBS_PRODUCT_NAME?: string;
  MAIN_CATEGORY_ID?: number;
  SUB_CATEGORY_ID?: number;
  UOM_ID?: number;
  NO_OF_PCS_PER_PACKING?: number;
  ALTERNATE_UOM_ID?: number;
  COST_CENTRE_ID?: number;
  COMPANY_ID?: number;
  PRODUCTION_COST?: number;
  VAT_PERCENTAGE?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllProductMasterService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .execute("VMaster.SHOW_PRODUCT_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_PRODUCT_MASTER SP error:", error);
    throw error;
  }
};

export const getProductMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PRODUCT_ID", sql.Int, id)
      .execute("VMaster.GET_PRODUCT_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_PRODUCT_MASTER SP error:", error);
    throw error;
  }
};

export const saveProductMasterService = async (data: ProductMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PRODUCT_ID", sql.Int, data.PRODUCT_ID ?? 0)
      .input("PRODUCT_NAME", sql.VarChar(1500), data.PRODUCT_NAME || null)
      .input("TBS_PRODUCT_NAME", sql.VarChar(sql.MAX), data.TBS_PRODUCT_NAME || null)
      .input("MAIN_CATEGORY_ID", sql.Int, data.MAIN_CATEGORY_ID ?? null)
      .input("SUB_CATEGORY_ID", sql.Int, data.SUB_CATEGORY_ID ?? null)
      .input("UOM_ID", sql.Int, data.UOM_ID ?? null)
      .input("NO_OF_PCS_PER_PACKING", sql.Decimal(15, 2), data.NO_OF_PCS_PER_PACKING ?? null)
      .input("ALTERNATE_UOM_ID", sql.Int, data.ALTERNATE_UOM_ID ?? null)
      .input("COST_CENTRE_ID", sql.Int, data.COST_CENTRE_ID ?? null)
      .input("COMPANY_ID", sql.Int, data.COMPANY_ID ?? null)
      .input("PRODUCTION_COST", sql.Decimal(15, 2), data.PRODUCTION_COST ?? null)
      .input("VAT_PERCENTAGE", sql.Decimal(15, 2), data.VAT_PERCENTAGE ?? null)
      .input("REMARKS", sql.VarChar(2000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_PRODUCT_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to save product");

    return { message: message || "Product saved successfully" };
  } catch (error) {
    console.error("SAVE_PRODUCT_MASTER SP error:", error);
    throw error;
  }
};

export const updateProductMasterService = async (data: ProductMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PRODUCT_ID", sql.Int, data.PRODUCT_ID ?? 0)
      .input("PRODUCT_NAME", sql.VarChar(1500), data.PRODUCT_NAME ?? null)
      .input("TBS_PRODUCT_NAME", sql.VarChar(sql.MAX), data.TBS_PRODUCT_NAME ?? null)
      .input("MAIN_CATEGORY_ID", sql.Int, data.MAIN_CATEGORY_ID ?? null)
      .input("SUB_CATEGORY_ID", sql.Int, data.SUB_CATEGORY_ID ?? null)
      .input("UOM_ID", sql.Int, data.UOM_ID ?? null)
      .input("NO_OF_PCS_PER_PACKING", sql.Decimal(15, 2), data.NO_OF_PCS_PER_PACKING ?? null)
      .input("ALTERNATE_UOM_ID", sql.Int, data.ALTERNATE_UOM_ID ?? null)
      .input("COST_CENTRE_ID", sql.Int, data.COST_CENTRE_ID ?? null)
      .input("COMPANY_ID", sql.Int, data.COMPANY_ID ?? null)
      .input("PRODUCTION_COST", sql.Decimal(15, 2), data.PRODUCTION_COST ?? null)
      .input("VAT_PERCENTAGE", sql.Decimal(15, 2), data.VAT_PERCENTAGE ?? null)
      .input("REMARKS", sql.VarChar(2000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_PRODUCT_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update product");

    return { message: message || "Product updated successfully" };
  } catch (error) {
    console.error("UPDATE_PRODUCT_MASTER SP error:", error);
    throw error;
  }
};

export const deleteProductMasterService = async (
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
      .input("PRODUCT_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_PRODUCT_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete product");

    return { message: message || "Product deleted successfully" };
  } catch (error) {
    console.error("DELETE_PRODUCT_MASTER SP error:", error);
    throw error;
  }
};
