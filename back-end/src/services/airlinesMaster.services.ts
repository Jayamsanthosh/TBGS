import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface AirlinesMasterData {
  AIRLINE_ID?: number;
  AIRLINE_NAME: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const addStatusAlias = (rows: any[]) =>
  (rows || []).map((r: any) => ({
    ...r,
    statusMaster: r.STATUS_MASTER || r.statusMaster,
  }));

export const getAllAirlinesMasterService = async (status = "ALL") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    if (status === "ALL") {
      const statuses = ["AC", "IA"];
      let allRows: any[] = [];
      for (const s of statuses) {
        const result = await pool
          .request()
          .input("status", sql.VarChar(10), s)
          .execute("VMaster.SHOW_AIRLINES_MASTER");
        allRows = allRows.concat(result.recordset || []);
      }
      return addStatusAlias(allRows);
    }

    const result = await pool
      .request()
      .input("status", sql.VarChar(10), status)
      .execute("VMaster.SHOW_AIRLINES_MASTER");
    return addStatusAlias(result.recordset || []);
  } catch (error) {
    console.error("SHOW_AIRLINES_MASTER SP error:", error);
    throw error;
  }
};

export const getAirlinesMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("AIRLINE_ID", sql.Int, id)
      .execute("VMaster.GET_AIRLINES_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_AIRLINES_MASTER SP error:", error);
    throw error;
  }
};

export const saveAirlinesMasterService = async (data: AirlinesMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("AIRLINE_ID", sql.Int, data.AIRLINE_ID ?? 0)
      .input("AIRLINE_NAME", sql.VarChar(10), data.AIRLINE_NAME || null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_AIRLINES_MASTER");

    const { message, data: id } = parseSprocResult(result.recordset?.[0], "Failed to save airline");
    return { message: message || "Data saved successfully", AIRLINE_ID: id };
  } catch (error) {
    console.error("SAVE_AIRLINES_MASTER SP error:", error);
    throw error;
  }
};

export const updateAirlinesMasterService = async (data: AirlinesMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("AIRLINE_ID", sql.Int, data.AIRLINE_ID ?? 0)
      .input("AIRLINE_NAME", sql.VarChar(10), data.AIRLINE_NAME ?? null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_AIRLINES_MASTER");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to update airline");
    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_AIRLINES_MASTER SP error:", error);
    throw error;
  }
};

export const deleteAirlinesMasterService = async (
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
      .input("AIRLINE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_AIRLINES_MASTER");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to delete airline");
    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_AIRLINES_MASTER SP error:", error);
    throw error;
  }
};
