import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

const isDuplicateKeyError = (error: any): boolean =>
  error?.number === 2627 || error?.number === 2601;

const DUPLICATE_NAME_MESSAGE = "Sales Package Type Name Already Exists";

export interface SalesPackageTypeMasterData {
  SALES_PACKAGE_TYPE_ID?: number;
  SALES_PACKAGE_TYPE_NAME: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  LINK_ID?: number | null;
}

export const getAllSalesPackageTypeMasterService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .execute("VMaster.SHOW_SALES_PACKAGE_TYPE_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_SALES_PACKAGE_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const getSalesPackageTypeMasterByIdService = async (id: number, linkId?: number | null) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SALES_PACKAGE_TYPE_ID", sql.Int, id)
      .input("LINK_ID", sql.Int, linkId ?? null)
      .execute("VMaster.GET_SALES_PACKAGE_TYPE_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_SALES_PACKAGE_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const saveSalesPackageTypeMasterService = async (data: SalesPackageTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SALES_PACKAGE_TYPE_ID", sql.Int, data.SALES_PACKAGE_TYPE_ID ?? 0)
      .input("SALES_PACKAGE_TYPE_NAME", sql.VarChar(50), data.SALES_PACKAGE_TYPE_NAME || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .input("LINK_ID", sql.Int, data.LINK_ID ?? null)
      .execute("VMaster.SAVE_SALES_PACKAGE_TYPE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to save sales package type");

    return { message: message || "Sales package type saved successfully" };
  } catch (error) {
    if (isDuplicateKeyError(error)) throw new Error(DUPLICATE_NAME_MESSAGE);
    console.error("SAVE_SALES_PACKAGE_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const updateSalesPackageTypeMasterService = async (data: SalesPackageTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SALES_PACKAGE_TYPE_ID", sql.Int, data.SALES_PACKAGE_TYPE_ID ?? 0)
      .input("SALES_PACKAGE_TYPE_NAME", sql.VarChar(50), data.SALES_PACKAGE_TYPE_NAME ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .input("LINK_ID", sql.Int, data.LINK_ID ?? null)
      .execute("VMaster.UPDATE_SALES_PACKAGE_TYPE_MASTER");

    const { message, data: updatedId } = parseSprocResult(result.recordset?.[0], "Failed to update sales package type");

    return {
      message: message || "Sales package type updated successfully",
      SALES_PACKAGE_TYPE_ID: updatedId || Number(data.SALES_PACKAGE_TYPE_ID ?? 0),
    };
  } catch (error) {
    if (isDuplicateKeyError(error)) throw new Error(DUPLICATE_NAME_MESSAGE);
    console.error("UPDATE_SALES_PACKAGE_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const deleteSalesPackageTypeMasterService = async (
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
      .input("SALES_PACKAGE_TYPE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_SALES_PACKAGE_TYPE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete");

    return { message: message || "Sales package type deleted successfully" };
  } catch (error) {
    console.error("DELETE_SALES_PACKAGE_TYPE_MASTER SP error:", error);
    throw error;
  }
};
