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

export interface SalesTypeMasterData {
  SALES_TYPE_ID?: number;
  SALES_TYPE_NAME: string;
  SALES_TYPE_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
}

export const getAllSalesTypeMasterService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .execute("VMaster.SHOW_SALES_TYPE_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_SALES_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const getSalesTypeMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SALES_TYPE_ID", sql.Int, id)
      .execute("VMaster.GET_SALES_TYPE_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_SALES_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const saveSalesTypeMasterService = async (data: SalesTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SALES_TYPE_ID", sql.Int, data.SALES_TYPE_ID ?? 0)
      .input("SALES_TYPE_NAME", sql.VarChar(50), data.SALES_TYPE_NAME || null)
      .input("SALES_TYPE_DESCRIPTION", sql.VarChar(50), data.SALES_TYPE_DESCRIPTION || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), normalizeStatus(data.STATUS_MASTER))
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_SALES_TYPE_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save sales type");

    return { message: message || "Data saved successfully", SALES_TYPE_ID: savedData };
  } catch (error) {
    console.error("SAVE_SALES_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const updateSalesTypeMasterService = async (data: SalesTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SALES_TYPE_ID", sql.Int, data.SALES_TYPE_ID ?? 0)
      .input("SALES_TYPE_NAME", sql.VarChar(50), data.SALES_TYPE_NAME || null)
      .input("SALES_TYPE_DESCRIPTION", sql.VarChar(50), data.SALES_TYPE_DESCRIPTION || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), normalizeStatus(data.STATUS_MASTER))
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.UPDATE_SALES_TYPE_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to update sales type");

    return { message: message || "Record updated successfully", SALES_TYPE_ID: savedData };
  } catch (error) {
    console.error("UPDATE_SALES_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const deleteSalesTypeMasterService = async (id: number, user = "Admin", role = "Admin", macAddress = "WEB") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SALES_TYPE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user)
      .input("ROLE", sql.VarChar(50), role)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VMaster.DELETE_SALES_TYPE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete sales type");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_SALES_TYPE_MASTER SP error:", error);
    throw error;
  }
};