import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface CampMasterData {
  CAMP_ID?: number;
  CAMP_NAME: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllCampMasterService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .execute("VMaster.SHOW_CAMP_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_CAMP_MASTER SP error:", error);
    throw error;
  }
};

export const getCampMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("CAMP_ID", sql.Int, id)
      .execute("VMaster.GET_CAMP_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_CAMP_MASTER SP error:", error);
    throw error;
  }
};

export const saveCampMasterService = async (data: CampMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("CAMP_ID", sql.Int, data.CAMP_ID ?? 0)
      .input("CAMP_NAME", sql.VarChar(50), data.CAMP_NAME || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_CAMP_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to save camp");

    return { message: message || "Camp saved successfully" };
  } catch (error) {
    console.error("SAVE_CAMP_MASTER SP error:", error);
    throw error;
  }
};

export const updateCampMasterService = async (data: CampMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("CAMP_ID", sql.Int, data.CAMP_ID ?? 0)
      .input("CAMP_NAME", sql.VarChar(50), data.CAMP_NAME ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_CAMP_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update camp");

    return { message: message || "Camp updated successfully" };
  } catch (error) {
    console.error("UPDATE_CAMP_MASTER SP error:", error);
    throw error;
  }
};

export const deleteCampMasterService = async (
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
      .input("CAMP_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_CAMP_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete camp");

    return { message: message || "Camp deleted successfully" };
  } catch (error) {
    console.error("DELETE_CAMP_MASTER SP error:", error);
    throw error;
  }
};
