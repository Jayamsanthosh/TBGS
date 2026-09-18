import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface AirportMasterData {
  AIRPORT_ID?: number;
  AIRPORT_NAME?: string;
  COUNTRY_ID?: number;
  REGION_ID?: number;
  DISTRICT_ID?: number;
  LOCATION_NAME?: string;
  AIRPORT_ADDRESS?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const serializeRecordset = (rows: any[]) =>
  (rows || []).map((r: any) => ({ ...r, id: r.AIRPORT_ID }));

export const getAllAirportMasterService = async (status?: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    if (status === "ALL" || !status) {
      const statuses = ["AC", "IA"];
      let allRows: any[] = [];
      for (const s of statuses) {
        const result = await pool
          .request()
          .input("STATUS", sql.VarChar(50), s)
          .execute("VMaster.SHOW_AIRPORT_MASTER");
        allRows = allRows.concat(result.recordset || []);
      }
      return serializeRecordset(allRows);
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(50), status)
      .execute("VMaster.SHOW_AIRPORT_MASTER");
    return serializeRecordset(result.recordset || []);
  } catch (error) {
    console.error("SHOW_AIRPORT_MASTER SP error:", error);
    throw error;
  }
};

export const getAirportMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("AIRPORT_ID", sql.Int, id)
      .execute("VMaster.GET_AIRPORT_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_AIRPORT_MASTER SP error:", error);
    throw error;
  }
};

export const saveAirportMasterService = async (data: AirportMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("AIRPORT_NAME", sql.VarChar(10), data.AIRPORT_NAME || null)
      .input("COUNTRY_ID", sql.Int, data.COUNTRY_ID ?? 0)
      .input("REGION_ID", sql.Int, data.REGION_ID ?? 0)
      .input("DISTRICT_ID", sql.Int, data.DISTRICT_ID ?? 0)
      .input("LOCATION_NAME", sql.VarChar(50), data.LOCATION_NAME || null)
      .input("AIRPORT_ADDRESS", sql.VarChar(150), data.AIRPORT_ADDRESS || null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_AIRPORT_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save airport");

    return { message: message || "Data saved successfully", AIRPORT_ID: savedData };
  } catch (error) {
    console.error("SAVE_AIRPORT_MASTER SP error:", error);
    throw error;
  }
};

export const updateAirportMasterService = async (data: AirportMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("AIRPORT_ID", sql.Int, data.AIRPORT_ID ?? 0)
      .input("AIRPORT_NAME", sql.VarChar(10), data.AIRPORT_NAME ?? null)
      .input("COUNTRY_ID", sql.Int, data.COUNTRY_ID ?? 0)
      .input("REGION_ID", sql.Int, data.REGION_ID ?? 0)
      .input("DISTRICT_ID", sql.Int, data.DISTRICT_ID ?? 0)
      .input("LOCATION_NAME", sql.VarChar(50), data.LOCATION_NAME ?? null)
      .input("AIRPORT_ADDRESS", sql.VarChar(150), data.AIRPORT_ADDRESS ?? null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_AIRPORT_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update airport");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_AIRPORT_MASTER SP error:", error);
    throw error;
  }
};

export const deleteAirportMasterService = async (
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
      .input("AIRPORT_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_AIRPORT_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete airport");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    throw error;
  }
};