import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface TruckTypeMasterData {
  TRUCK_TYPE_ID?: number;
  TRUCK_TYPE_NAME: string;
  TRUCK_TYPE_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllTruckTypeMasterService = async (status = "ALL") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    if (status === "ALL") {
      const statuses = ["AC", "IN"];
      let allRows: any[] = [];
      for (const s of statuses) {
        const result = await pool
          .request()
          .input("STATUS", sql.VarChar(50), s)
          .execute("VMaster.SHOW_TRUCK_TYPE_MASTER");
        allRows = allRows.concat(result.recordset || []);
      }
      return allRows;
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(50), status)
      .execute("VMaster.SHOW_TRUCK_TYPE_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_TRUCK_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const getTruckTypeMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("TRUCK_TYPE_ID", sql.Int, id)
      .execute("VMaster.GET_TRUCK_TYPE_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_TRUCK_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const saveTruckTypeMasterService = async (data: TruckTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .output("TRUCK_TYPE_ID", sql.Int)
      .input("TRUCK_TYPE_NAME", sql.VarChar(50), data.TRUCK_TYPE_NAME || null)
      .input("TRUCK_TYPE_DESCRIPTION", sql.VarChar(50), data.TRUCK_TYPE_DESCRIPTION || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_TRUCK_TYPE_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save truck type");

    return { message: message || "Data saved successfully", TRUCK_TYPE_ID: savedData };
  } catch (error) {
    console.error("SAVE_TRUCK_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const updateTruckTypeMasterService = async (data: TruckTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("TRUCK_TYPE_ID", sql.Int, data.TRUCK_TYPE_ID ?? 0)
      .input("TRUCK_TYPE_NAME", sql.VarChar(50), data.TRUCK_TYPE_NAME ?? null)
      .input("TRUCK_TYPE_DESCRIPTION", sql.VarChar(50), data.TRUCK_TYPE_DESCRIPTION ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_TRUCK_TYPE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update truck type");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_TRUCK_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const deleteTruckTypeMasterService = async (
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
      .input("TRUCK_TYPE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_TRUCK_TYPE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete truck type");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_TRUCK_TYPE_MASTER SP error:", error);
    throw error;
  }
};