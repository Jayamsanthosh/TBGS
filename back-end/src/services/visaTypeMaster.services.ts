import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface VisaTypeMasterData {
  VISA_TYPE_ID?: number;
  VISA_TYPE_NAME: string;
  VISA_VALIDITY_DAYS?: number;
  REMARKS?: string;
  STATUS_MASTER: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllVisaTypeMasterService = async (status?: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const request = pool.request();
    if (status) {
      request.input("status", sql.VarChar(2), status);
    }
    const result = await request.execute("VMaster.SHOW_VISA_TYPE_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_VISA_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const getVisaTypeMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("VISA_TYPE_ID", sql.Int, id)
      .execute("VMaster.GET_VISA_TYPE_MASTER");
    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_VISA_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const saveVisaTypeMasterService = async (data: VisaTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("VISA_TYPE_NAME", sql.VarChar(200), data.VISA_TYPE_NAME || null)
      .input("VISA_VALIDITY_DAYS", sql.Int, data.VISA_VALIDITY_DAYS ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(50), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_VISA_TYPE_MASTER");
    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to save visa type");
    return { message: message || "Visa type saved successfully" };
  } catch (error) {
    console.error("SAVE_VISA_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const updateVisaTypeMasterService = async (data: VisaTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("VISA_TYPE_ID", sql.Int, data.VISA_TYPE_ID ?? 0)
      .input("VISA_TYPE_NAME", sql.VarChar(200), data.VISA_TYPE_NAME ?? null)
      .input("VISA_VALIDITY_DAYS", sql.Int, data.VISA_VALIDITY_DAYS ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(50), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_VISA_TYPE_MASTER");
    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update visa type");
    return { message: message || "Visa type updated successfully" };
  } catch (error) {
    console.error("UPDATE_VISA_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const deleteVisaTypeMasterService = async (
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
      .input("VISA_TYPE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_VISA_TYPE_MASTER");
    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete");
    return { message: message || "Visa type deleted successfully" };
  } catch (error) {
    console.error("DELETE_VISA_TYPE_MASTER SP error:", error);
    throw error;
  }
};
