import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface PriorityMasterData {
  PRIORITY_ID?: number;
  PRIORITY_NAME: string;
  PRIORITY_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllPriorityMasterService = async (status = "ALL") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    if (status === "ALL") {
      const statuses = ["AC", "IA"];
      let allRows: any[] = [];
      for (const s of statuses) {
        const result = await pool
          .request()
          .input("STATUS", sql.VarChar(50), s)
          .execute("VMaster.SHOW_PRIORITY_MASTER");
        allRows = allRows.concat(result.recordset || []);
      }
      return allRows;
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(50), status)
      .execute("VMaster.SHOW_PRIORITY_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_PRIORITY_MASTER SP error:", error);
    throw error;
  }
};

export const getPriorityMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PRIORITY_ID", sql.Int, id)
      .execute("VMaster.GET_PRIORITY_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_PRIORITY_MASTER SP error:", error);
    throw error;
  }
};

export const savePriorityMasterService = async (data: PriorityMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PRIORITY_ID", sql.Int, data.PRIORITY_ID ?? 0)
      .input("PRIORITY_NAME", sql.VarChar(50), data.PRIORITY_NAME || null)
      .input("PRIORITY_DESCRIPTION", sql.VarChar(50), data.PRIORITY_DESCRIPTION || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_PRIORITY_MASTER");

    const { message, data: id } = parseSprocResult(result.recordset?.[0], "Failed to save priority");
    return { message: message || "Data saved successfully", PRIORITY_ID: id };
  } catch (error) {
    console.error("SAVE_PRIORITY_MASTER SP error:", error);
    throw error;
  }
};

export const updatePriorityMasterService = async (data: PriorityMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PRIORITY_ID", sql.Int, data.PRIORITY_ID ?? 0)
      .input("PRIORITY_NAME", sql.VarChar(50), data.PRIORITY_NAME ?? null)
      .input("PRIORITY_DESCRIPTION", sql.VarChar(50), data.PRIORITY_DESCRIPTION ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_PRIORITY_MASTER");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to update priority");
    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_PRIORITY_MASTER SP error:", error);
    throw error;
  }
};

export const deletePriorityMasterService = async (
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
      .input("PRIORITY_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_PRIORITY_MASTER");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to delete priority");
    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_PRIORITY_MASTER SP error:", error);
    throw error;
  }
};