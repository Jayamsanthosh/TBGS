import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface BusBoardingLocationMasterData {
  BUS_BOARDING_LOCATION_ID?: number;
  BUS_BOARDING_LOCATION_NAME: string;
  BUS_CODE: string;
  REMARKS?: string;
  STATUS_MASTER: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllBusBoardingLocationMasterService = async (status?: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const request = pool.request();
    if (status) {
      request.input("status", sql.VarChar(2), status);
    }
    const result = await request.execute("VMaster.SHOW_BUS_BOARDING_LOCATION_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_BUS_BOARDING_LOCATION_MASTER SP error:", error);
    throw error;
  }
};

export const getBusBoardingLocationMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("BUS_BOARDING_LOCATION_ID", sql.Int, id)
      .execute("VMaster.GET_BUS_BOARDING_LOCATION_MASTER");
    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_BUS_BOARDING_LOCATION_MASTER SP error:", error);
    throw error;
  }
};

export const saveBusBoardingLocationMasterService = async (data: BusBoardingLocationMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("BUS_BOARDING_LOCATION_NAME", sql.VarChar(200), data.BUS_BOARDING_LOCATION_NAME || null)
      .input("BUS_CODE", sql.VarChar(50), data.BUS_CODE || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(50), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_BUS_BOARDING_LOCATION_MASTER");
    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to save bus boarding location");

    return { message: message || "Bus boarding location saved successfully" };
  } catch (error) {
    console.error("SAVE_BUS_BOARDING_LOCATION_MASTER SP error:", error);
    throw error;
  }
};

export const updateBusBoardingLocationMasterService = async (data: BusBoardingLocationMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("BUS_BOARDING_LOCATION_ID", sql.Int, data.BUS_BOARDING_LOCATION_ID ?? 0)
      .input("BUS_BOARDING_LOCATION_NAME", sql.VarChar(200), data.BUS_BOARDING_LOCATION_NAME ?? null)
      .input("BUS_CODE", sql.VarChar(50), data.BUS_CODE ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(50), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_BUS_BOARDING_LOCATION_MASTER");
    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update bus boarding location");

    return { message: message || "Bus boarding location updated successfully" };
  } catch (error) {
    console.error("UPDATE_BUS_BOARDING_LOCATION_MASTER SP error:", error);
    throw error;
  }
};

export const deleteBusBoardingLocationMasterService = async (
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
      .input("BUS_BOARDING_LOCATION_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_BUS_BOARDING_LOCATION_MASTER");
    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete");

    return { message: message || "Bus boarding location deleted successfully" };
  } catch (error) {
    console.error("DELETE_BUS_BOARDING_LOCATION_MASTER SP error:", error);
    throw error;
  }
};
