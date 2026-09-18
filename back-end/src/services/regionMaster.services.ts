import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface RegionMasterData {
  REGION_ID?: number;
  REGION_NAME: string;
  COUNTRY_ID: number;
  CAPITAL: string;
  NO_OF_DISTRICTS: number;
  TOTAL_POPULATION: number;
  ZONE_NAME: string;
  DISTANCE_FROM_ARUSHA: number;
  STATUS_MASTER: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllRegionMasterService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .execute("VMaster.SHOW_REGION_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_REGION_MASTER SP error:", error);
    throw error;
  }
};

export const getRegionMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("REGION_ID", sql.Int, id)
      .execute("VMaster.GET_REGION_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_REGION_MASTER SP error:", error);
    throw error;
  }
};

export const saveRegionMasterService = async (data: RegionMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("REGION_ID", sql.Int, data.REGION_ID ?? 0)
      .input("REGION_NAME", sql.VarChar(50), data.REGION_NAME || null)
      .input("COUNTRY_ID", sql.Int, data.COUNTRY_ID ?? 0)
      .input("CAPITAL", sql.VarChar(50), data.CAPITAL || null)
      .input("NO_OF_DISTRICTS", sql.Int, data.NO_OF_DISTRICTS ?? 0)
      .input("TOTAL_POPULATION", sql.Decimal(18, 2), data.TOTAL_POPULATION ?? 0)
      .input("ZONE_NAME", sql.VarChar(50), data.ZONE_NAME || null)
      .input("DISTANCE_FROM_ARUSHA", sql.Decimal(18, 2), data.DISTANCE_FROM_ARUSHA ?? 0)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_REGION_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to save region");

    return { message: message || "Region saved successfully" };
  } catch (error) {
    console.error("SAVE_REGION_MASTER SP error:", error);
    throw error;
  }
};

export const updateRegionMasterService = async (data: RegionMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("REGION_ID", sql.Int, data.REGION_ID ?? 0)
      .input("REGION_NAME", sql.VarChar(50), data.REGION_NAME ?? null)
      .input("COUNTRY_ID", sql.Int, data.COUNTRY_ID ?? 0)
      .input("CAPITAL", sql.VarChar(50), data.CAPITAL ?? null)
      .input("NO_OF_DISTRICTS", sql.Int, data.NO_OF_DISTRICTS ?? 0)
      .input("TOTAL_POPULATION", sql.Decimal(18, 2), data.TOTAL_POPULATION ?? 0)
      .input("ZONE_NAME", sql.VarChar(50), data.ZONE_NAME ?? null)
      .input("DISTANCE_FROM_ARUSHA", sql.Decimal(18, 2), data.DISTANCE_FROM_ARUSHA ?? 0)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_REGION_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update region");

    return { message: message || "Region updated successfully" };
  } catch (error) {
    console.error("UPDATE_REGION_MASTER SP error:", error);
    throw error;
  }
};

export const deleteRegionMasterService = async (
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
      .input("REGION_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_REGION_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete region");

    return { message: message || "Region deleted successfully" };
  } catch (error) {
    console.error("DELETE_REGION_MASTER SP error:", error);
    throw error;
  }
};
