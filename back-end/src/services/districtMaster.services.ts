import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface DistrictMasterData {
  District_id?: number;
  COUNTRY_ID: number;
  REGION_ID: number;
  DISTRICT_NAME: string;
  TOTAL_POPULATION: number;
  ZONE_NAME: string;
  DISTANCE_FROM_ARUSHA: number;
  STATUS_MASTER: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllDistrictMasterService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .execute("VMaster.SHOW_DISTRICT_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_DISTRICT_MASTER SP error:", error);
    throw error;
  }
};

export const getDistrictMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("DISTRICT_ID", sql.Int, id)
      .execute("VMaster.GET_DISTRICT_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_DISTRICT_MASTER SP error:", error);
    throw error;
  }
};

export const saveDistrictMasterService = async (data: DistrictMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("DISTRICT_ID", sql.Int, data.District_id ?? 0)
      .input("COUNTRY_ID", sql.Int, data.COUNTRY_ID ?? 0)
      .input("REGION_ID", sql.Int, data.REGION_ID ?? 0)
      .input("DISTRICT_NAME", sql.VarChar(50), data.DISTRICT_NAME || null)
      .input("TOTAL_POPULATION", sql.Decimal(18, 2), data.TOTAL_POPULATION ?? 0)
      .input("ZONE_NAME", sql.VarChar(50), data.ZONE_NAME || null)
      .input("DISTANCE_FROM_ARUSHA", sql.Decimal(18, 2), data.DISTANCE_FROM_ARUSHA ?? 0)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_DISTRICT_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to save district");

    return { message: message || "District saved successfully" };
  } catch (error) {
    console.error("SAVE_DISTRICT_MASTER SP error:", error);
    throw error;
  }
};

export const updateDistrictMasterService = async (data: DistrictMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("DISTRICT_ID", sql.Int, data.District_id ?? 0)
      .input("COUNTRY_ID", sql.Int, data.COUNTRY_ID ?? 0)
      .input("REGION_ID", sql.Int, data.REGION_ID ?? 0)
      .input("DISTRICT_NAME", sql.VarChar(50), data.DISTRICT_NAME ?? null)
      .input("TOTAL_POPULATION", sql.Decimal(18, 2), data.TOTAL_POPULATION ?? 0)
      .input("ZONE_NAME", sql.VarChar(50), data.ZONE_NAME ?? null)
      .input("DISTANCE_FROM_ARUSHA", sql.Decimal(18, 2), data.DISTANCE_FROM_ARUSHA ?? 0)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_DISTRICT_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update district");

    return { message: message || "District updated successfully" };
  } catch (error) {
    console.error("UPDATE_DISTRICT_MASTER SP error:", error);
    throw error;
  }
};

export const deleteDistrictMasterService = async (
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
      .input("DISTRICT_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_DISTRICT_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete district");

    return { message: message || "District deleted successfully" };
  } catch (error) {
    console.error("DELETE_DISTRICT_MASTER SP error:", error);
    throw error;
  }
};
