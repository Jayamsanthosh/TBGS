import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface PricePackageData {
  PRICE_PACKAGE_ID?: number;
  PRICE_PACKAGE_TYPE?: string;
  PRICE_PACKAGE_NAME: string;
  PRICE_PACKAGE_DAYS?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllPricePackageService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .execute("VMaster.SHOW_PRICE_PACKAGE_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_PRICE_PACKAGE_MASTER SP error:", error);
    throw error;
  }
};

export const getPricePackageByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PRICE_PACKAGE_ID", sql.Int, id)
      .execute("VMaster.GET_PRICE_PACKAGE_MASTER");
    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_PRICE_PACKAGE_MASTER SP error:", error);
    throw error;
  }
};

export const savePricePackageService = async (data: PricePackageData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PRICE_PACKAGE_ID", sql.Int, data.PRICE_PACKAGE_ID ?? 0)
      .input("PRICE_PACKAGE_TYPE", sql.VarChar(50), data.PRICE_PACKAGE_TYPE || null)
      .input("PRICE_PACKAGE_NAME", sql.VarChar(50), data.PRICE_PACKAGE_NAME || null)
      .input("PRICE_PACKAGE_DAYS", sql.Int, data.PRICE_PACKAGE_DAYS ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_PRICE_PACKAGE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to save price package");

    return { message: message || "Price package saved successfully" };
  } catch (error) {
    console.error("SAVE_PRICE_PACKAGE_MASTER SP error:", error);
    throw error;
  }
};

export const updatePricePackageService = async (data: PricePackageData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PRICE_PACKAGE_ID", sql.Int, data.PRICE_PACKAGE_ID ?? 0)
      .input("PRICE_PACKAGE_TYPE", sql.VarChar(50), data.PRICE_PACKAGE_TYPE ?? null)
      .input("PRICE_PACKAGE_NAME", sql.VarChar(50), data.PRICE_PACKAGE_NAME ?? null)
      .input("PRICE_PACKAGE_DAYS", sql.Int, data.PRICE_PACKAGE_DAYS ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_PRICE_PACKAGE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update price package");

    return { message: message || "Price package updated successfully" };
  } catch (error) {
    console.error("UPDATE_PRICE_PACKAGE_MASTER SP error:", error);
    throw error;
  }
};

export const deletePricePackageService = async (
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
      .input("PRICE_PACKAGE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_PRICE_PACKAGE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete");

    return { message: message || "Price package deleted successfully" };
  } catch (error) {
    console.error("DELETE_PRICE_PACKAGE_MASTER SP error:", error);
    throw error;
  }
};
