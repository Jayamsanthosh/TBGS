import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface VisaStatusMasterData {
  VISA_STATUS_ID?: number;
  VISA_STATUS_NAME: string;
  VISA_STATUS_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllVisaStatusMasterService = async (status = "ALL") => {
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
          .execute("VMaster.SHOW_VISA_STATUS_MASTER");
        allRows = allRows.concat(result.recordset || []);
      }
      return allRows;
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(50), status)
      .execute("VMaster.SHOW_VISA_STATUS_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_VISA_STATUS_MASTER SP error:", error);
    throw error;
  }
};

export const getVisaStatusMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("VISA_STATUS_ID", sql.Int, id)
      .execute("VMaster.GET_VISA_STATUS_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_VISA_STATUS_MASTER SP error:", error);
    throw error;
  }
};

export const saveVisaStatusMasterService = async (data: VisaStatusMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("VISA_STATUS_ID", sql.Int, data.VISA_STATUS_ID ?? 0)
      .input("VISA_STATUS_NAME", sql.VarChar(50), data.VISA_STATUS_NAME || null)
      .input("VISA_STATUS_DESCRIPTION", sql.VarChar(50), data.VISA_STATUS_DESCRIPTION || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_VISA_STATUS_MASTER");

    const { message, data: id } = parseSprocResult(result.recordset?.[0], "Failed to save visa status");
    return { message: message || "Data saved successfully", VISA_STATUS_ID: id };
  } catch (error) {
    console.error("SAVE_VISA_STATUS_MASTER SP error:", error);
    throw error;
  }
};

export const updateVisaStatusMasterService = async (data: VisaStatusMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("VISA_STATUS_ID", sql.Int, data.VISA_STATUS_ID ?? 0)
      .input("VISA_STATUS_NAME", sql.VarChar(50), data.VISA_STATUS_NAME ?? null)
      .input("VISA_STATUS_DESCRIPTION", sql.VarChar(50), data.VISA_STATUS_DESCRIPTION ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_VISA_STATUS_MASTER");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to update visa status");
    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_VISA_STATUS_MASTER SP error:", error);
    throw error;
  }
};

export const deleteVisaStatusMasterService = async (
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
      .input("VISA_STATUS_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_VISA_STATUS_MASTER");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to delete visa status");
    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_VISA_STATUS_MASTER SP error:", error);
    throw error;
  }
};