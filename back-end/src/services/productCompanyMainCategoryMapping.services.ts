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

export interface ProductCompanyMainCategoryMappingData {
  SNO?: number;
  COMPANY_ID: number;
  MAIN_CATEGORY_ID: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
}

export const getAllProductCompanyMainCategoryMappingService = async (companyId = "", mainCategoryId = "") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("COMPANY_ID", sql.VarChar(50), companyId)
      .input("MAIN_CATEGORY_ID", sql.VarChar(5), mainCategoryId)
      .execute("VMaster.SHOW_PRODUCT_COMPANY_MAIN_CATEGORY_MAPPING");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_PRODUCT_COMPANY_MAIN_CATEGORY_MAPPING SP error:", error);
    throw error;
  }
};

export const getProductCompanyMainCategoryMappingByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, id)
      .execute("VMaster.GET_PRODUCT_COMPANY_MAIN_CATEGORY_MAPPING");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_PRODUCT_COMPANY_MAIN_CATEGORY_MAPPING SP error:", error);
    throw error;
  }
};

export const saveProductCompanyMainCategoryMappingService = async (data: ProductCompanyMainCategoryMappingData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, data.SNO ?? 0)
      .input("COMPANY_ID", sql.Int, data.COMPANY_ID ?? null)
      .input("MAIN_CATEGORY_ID", sql.Int, data.MAIN_CATEGORY_ID ?? null)
      .input("REMARKS", sql.VarChar(2000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), normalizeStatus(data.STATUS_MASTER))
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_PRODUCT_COMPANY_MAIN_CATEGORY_MAPPING");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save mapping");

    return { message: message || "Data saved successfully", SNO: savedData };
  } catch (error) {
    console.error("SAVE_PRODUCT_COMPANY_MAIN_CATEGORY_MAPPING SP error:", error);
    throw error;
  }
};

export const updateProductCompanyMainCategoryMappingService = async (data: ProductCompanyMainCategoryMappingData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, data.SNO ?? 0)
      .input("COMPANY_ID", sql.Int, data.COMPANY_ID ?? null)
      .input("MAIN_CATEGORY_ID", sql.Int, data.MAIN_CATEGORY_ID ?? null)
      .input("REMARKS", sql.VarChar(2000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), normalizeStatus(data.STATUS_MASTER))
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.UPDATE_PRODUCT_COMPANY_MAIN_CATEGORY_MAPPING");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to update mapping");

    return { message: message || "Record updated successfully", SNO: savedData };
  } catch (error) {
    console.error("UPDATE_PRODUCT_COMPANY_MAIN_CATEGORY_MAPPING SP error:", error);
    throw error;
  }
};

export const deleteProductCompanyMainCategoryMappingService = async (id: number, user = "Admin", role = "Admin", macAddress = "WEB") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, id)
      .input("USER", sql.VarChar(50), user)
      .input("ROLE", sql.VarChar(50), role)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VMaster.DELETE_PRODUCT_COMPANY_MAIN_CATEGORY_MAPPING");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to delete mapping");

    return { message: message || "Record deleted successfully", SNO: savedData };
  } catch (error) {
    console.error("DELETE_PRODUCT_COMPANY_MAIN_CATEGORY_MAPPING SP error:", error);
    throw error;
  }
};