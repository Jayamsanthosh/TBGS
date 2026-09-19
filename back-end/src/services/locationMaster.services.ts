import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface LocationMasterData {
  LOCATION_ID?: number;
  LOCATION_NAME?: string;
  COUNTRY_ID?: number;
  REGION_ID?: number;
  DISTRICT_ID?: number;
  CAMP_ID?: number;
  STORE_ID?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const toInt = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

export const getAllLocationMasterService = async (status?: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(20), status || "Active")
      .execute("VMaster.SHOW_LOCATION_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_LOCATION_MASTER SP error:", error);
    throw error;
  }
};

export const getLocationMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("LOCATION_ID", sql.Int, id)
      .execute("VMaster.GET_LOCATION_MASTER");
    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_LOCATION_MASTER SP error:", error);
    throw error;
  }
};

export const saveLocationMasterService = async (data: LocationMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("LOCATION_ID", sql.Int, toInt(data.LOCATION_ID))
      .input("LOCATION_NAME", sql.VarChar(50), data.LOCATION_NAME || null)
      .input("COUNTRY_ID", sql.Int, toInt(data.COUNTRY_ID))
      .input("REGION_ID", sql.Int, toInt(data.REGION_ID))
      .input("DISTRICT_ID", sql.Int, toInt(data.DISTRICT_ID))
      .input("CAMP_ID", sql.Int, toInt(data.CAMP_ID))
      .input("STORE_ID", sql.Int, toInt(data.STORE_ID))
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_LOCATION_MASTER");
    const { status, message, data: id } = parseSprocResult(result.recordset?.[0], "Failed to save location");
    return { message: message || "Location saved successfully", LOCATION_ID: id || Number(data.LOCATION_ID ?? 0) };
  } catch (error) {
    console.error("SAVE_LOCATION_MASTER SP error:", error);
    throw error;
  }
};

export const updateLocationMasterService = async (data: LocationMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("LOCATION_ID", sql.Int, toInt(data.LOCATION_ID))
      .input("LOCATION_NAME", sql.VarChar(50), data.LOCATION_NAME || null)
      .input("COUNTRY_ID", sql.Int, toInt(data.COUNTRY_ID))
      .input("REGION_ID", sql.Int, toInt(data.REGION_ID))
      .input("DISTRICT_ID", sql.Int, toInt(data.DISTRICT_ID))
      .input("CAMP_ID", sql.Int, toInt(data.CAMP_ID))
      .input("STORE_ID", sql.Int, toInt(data.STORE_ID))
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.UPDATE_LOCATION_MASTER");
    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update location");
    return { message: message || "Location updated successfully" };
  } catch (error) {
    console.error("UPDATE_LOCATION_MASTER SP error:", error);
    throw error;
  }
};

export const deleteLocationMasterService = async (
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
      .input("LOCATION_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_LOCATION_MASTER");
    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete");
    return { message: message || "Location deleted successfully" };
  } catch (error) {
    console.error("DELETE_LOCATION_MASTER SP error:", error);
    throw error;
  }
};
