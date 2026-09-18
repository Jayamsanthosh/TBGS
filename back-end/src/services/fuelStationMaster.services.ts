import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface FuelStationMasterData {
  FUEL_STATIONE_ID?: number;
  FUEL_STATIONE_NAME: string;
  COUNTRY_ID?: number;
  COUNTRY_NAME?: string;
  REGION_ID?: number;
  REGION_NAME?: string;
  DISTRICT_ID?: number;
  DISTRICT_NAME?: string;
  FUEL_STATION_ADDRESS?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const normalizeRow = (r: any) => ({
  ...r,
  COUNTRY_NAME: r.COUNTRY_NAME ?? r.Country_Name ?? null,
  REGION_NAME: r.REGION_NAME ?? null,
  DISTRICT_NAME: r.DISTRICT_NAME ?? r.District_Name ?? null,
  STATUS_MASTER: r.STATUS_MASTER ?? r.STATUS ?? null,
});

const normalizeRows = (rows: any[]) => (rows || []).map(normalizeRow);

const enrichRowsWithIds = async (rows: any[]) => {
  const enriched: any[] = [];
  for (const row of rows || []) {
    try {
      const detail = await getFuelStationMasterByIdService(row.FUEL_STATIONE_ID);
      enriched.push({
        ...row,
        COUNTRY_ID: detail?.COUNTRY_ID ?? row.COUNTRY_ID ?? null,
        REGION_ID: detail?.REGION_ID ?? row.REGION_ID ?? null,
        DISTRICT_ID: detail?.DISTRICT_ID ?? row.DISTRICT_ID ?? null,
      });
    } catch (error) {
      enriched.push(row);
    }
  }
  return enriched;
};

export const getAllFuelStationMasterService = async (status = "ALL") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    let rows: any[];
    if (status === "ALL") {
      const statuses = ["AC", "IN"];
      let allRows: any[] = [];
      for (const s of statuses) {
        const result = await pool
          .request()
          .input("STATUS", sql.VarChar(50), s)
          .execute("VMaster.SHOW_FUEL_STATION_MASTER");
        allRows = allRows.concat(result.recordset || []);
      }
      rows = allRows;
    } else {
      const result = await pool
        .request()
        .input("STATUS", sql.VarChar(50), status)
        .execute("VMaster.SHOW_FUEL_STATION_MASTER");
      rows = result.recordset || [];
    }

    return enrichRowsWithIds(normalizeRows(rows));
  } catch (error) {
    console.error("SHOW_FUEL_STATION_MASTER SP error:", error);
    throw error;
  }
};

export const getFuelStationMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("FUEL_STATIONE_ID", sql.Int, id)
      .execute("VMaster.GET_FUEL_STATION_MASTER");

    const row = result.recordset[0] || null;
    return row ? normalizeRow(row) : null;
  } catch (error) {
    console.error("GET_FUEL_STATION_MASTER SP error:", error);
    throw error;
  }
};

export const saveFuelStationMasterService = async (data: FuelStationMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .output("FUEL_STATIONE_ID", sql.Int)
      .input("FUEL_STATIONE_NAME", sql.VarChar(50), data.FUEL_STATIONE_NAME || null)
      .input("COUNTRY_ID", sql.Int, data.COUNTRY_ID ?? null)
      .input("REGION_ID", sql.Int, data.REGION_ID ?? null)
      .input("DISTRICT_ID", sql.Int, data.DISTRICT_ID ?? null)
      .input("FUEL_STATION_ADDRESS", sql.VarChar(200), data.FUEL_STATION_ADDRESS || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_FUEL_STATION_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save fuel station");

    const newId = result.output?.FUEL_STATIONE_ID ?? savedData;
    return { message: message || "Data saved successfully", FUEL_STATIONE_ID: newId };
  } catch (error) {
    console.error("SAVE_FUEL_STATION_MASTER SP error:", error);
    throw error;
  }
};

export const updateFuelStationMasterService = async (data: FuelStationMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const existing = await getFuelStationMasterByIdService(data.FUEL_STATIONE_ID ?? 0);
    if (!existing) {
      throw new Error("RECORD DOES NOT EXIST");
    }

    const result = await pool
      .request()
      .input("FUEL_STATIONE_ID", sql.Int, data.FUEL_STATIONE_ID ?? 0)
      .input("FUEL_STATIONE_NAME", sql.VarChar(50), data.FUEL_STATIONE_NAME ?? null)
      .input("COUNTRY_ID", sql.Int, data.COUNTRY_ID ?? null)
      .input("REGION_ID", sql.Int, data.REGION_ID ?? null)
      .input("DISTRICT_ID", sql.Int, data.DISTRICT_ID ?? null)
      .input("FUEL_STATION_ADDRESS", sql.VarChar(200), data.FUEL_STATION_ADDRESS ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_FUEL_STATION_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update fuel station");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_FUEL_STATION_MASTER SP error:", error);
    throw error;
  }
};

export const deleteFuelStationMasterService = async (
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
      .input("FUEL_STATIONE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_FUEL_STATION_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete fuel station");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_FUEL_STATION_MASTER SP error:", error);
    throw error;
  }
};