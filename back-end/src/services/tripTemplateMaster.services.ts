import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface TripTemplateMasterData {
  TRIP_TEMPLATE_ID?: number;
  TRIP_TEMPLATE_NAME?: string;
  TRIP_TEMPLATE_DESCRIPTION?: string;
  FROM_LOCATION_ID?: number;
  TO_LOCATION_ID?: number;
  DISTANCE_KM?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const toInt = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

const toDecimal = (v: any): number | null => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

export const getAllTripTemplateMasterService = async (status?: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    if (status === "ALL" || !status) {
      const statuses = ["AC", "IN"];
      let allRows: any[] = [];
      for (const s of statuses) {
        const result = await pool
          .request()
          .input("STATUS", sql.VarChar(50), s)
          .execute("VMaster.SHOW_TRIP_TEMPLATE_MASTER");
        allRows = allRows.concat(result.recordset || []);
      }
      return allRows;
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(50), status)
      .execute("VMaster.SHOW_TRIP_TEMPLATE_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_TRIP_TEMPLATE_MASTER SP error:", error);
    throw error;
  }
};

export const getTripTemplateMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("TRIP_TEMPLATE_ID", sql.Int, id)
      .execute("VMaster.GET_TRIP_TEMPLATE_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_TRIP_TEMPLATE_MASTER SP error:", error);
    throw error;
  }
};

export const saveTripTemplateMasterService = async (data: TripTemplateMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const request = pool.request();
    request.output("TRIP_TEMPLATE_ID", sql.Int);
    const result = await request
      .input("TRIP_TEMPLATE_NAME", sql.VarChar(50), data.TRIP_TEMPLATE_NAME || null)
      .input("TRIP_TEMPLATE_DESCRIPTION", sql.VarChar(100), data.TRIP_TEMPLATE_DESCRIPTION || null)
      .input("FROM_LOCATION_ID", sql.Int, toInt(data.FROM_LOCATION_ID))
      .input("TO_LOCATION_ID", sql.Int, toInt(data.TO_LOCATION_ID))
      .input("DISTANCE_KM", sql.Decimal(15, 2), toDecimal(data.DISTANCE_KM))
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_TRIP_TEMPLATE_MASTER");
    const { status, message, data: id } = parseSprocResult(result.recordset?.[0], "Failed to save trip template");
    return { message: message || "Trip template saved successfully", TRIP_TEMPLATE_ID: (result.output?.TRIP_TEMPLATE_ID ?? id) || Number(data.TRIP_TEMPLATE_ID ?? 0) };
  } catch (error) {
    console.error("SAVE_TRIP_TEMPLATE_MASTER SP error:", error);
    throw error;
  }
};

export const updateTripTemplateMasterService = async (data: TripTemplateMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const request = pool.request();
    const result = await request
      .input("TRIP_TEMPLATE_ID", sql.Int, toInt(data.TRIP_TEMPLATE_ID))
      .input("TRIP_TEMPLATE_NAME", sql.VarChar(50), data.TRIP_TEMPLATE_NAME || null)
      .input("TRIP_TEMPLATE_DESCRIPTION", sql.VarChar(100), data.TRIP_TEMPLATE_DESCRIPTION || null)
      .input("FROM_LOCATION_ID", sql.Int, toInt(data.FROM_LOCATION_ID))
      .input("TO_LOCATION_ID", sql.Int, toInt(data.TO_LOCATION_ID))
      .input("DISTANCE_KM", sql.Decimal(15, 2), toDecimal(data.DISTANCE_KM))
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.UPDATE_TRIP_TEMPLATE_MASTER");
    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update trip template");
    return { message: message || "Trip template updated successfully" };
  } catch (error) {
    console.error("UPDATE_TRIP_TEMPLATE_MASTER SP error:", error);
    throw error;
  }
};

export const deleteTripTemplateMasterService = async (
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
      .input("TRIP_TEMPLATE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_TRIP_TEMPLATE_MASTER");
    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete");
    return { message: message || "Trip template deleted successfully" };
  } catch (error) {
    console.error("DELETE_TRIP_TEMPLATE_MASTER SP error:", error);
    throw error;
  }
};
