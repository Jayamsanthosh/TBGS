import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface TrailerTypeMasterData {
  TRAILER_TYPE_ID?: number;
  TRAILER_TYPE_NAME: string;
  TRAILER_TYPE_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER: string;
  USER?: string;
  MAC_ADDRESS?: string;
  LINK_ID?: number | null;
}

export const getAllTrailerTypeMasterService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .execute("VMaster.SHOW_TRAILER_TYPE_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_TRAILER_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const getTrailerTypeMasterByIdService = async (id: number, linkId: number | null = null) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("TRAILER_TYPE_ID", sql.Int, id)
      .input("LINK_ID", sql.Int, linkId ?? null)
      .execute("VMaster.GET_TRAILER_TYPE_MASTER");
    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_TRAILER_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const saveTrailerTypeMasterService = async (data: TrailerTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("TRAILER_TYPE_ID", sql.Int, data.TRAILER_TYPE_ID ?? 0)
      .input("TRAILER_TYPE_NAME", sql.VarChar(50), data.TRAILER_TYPE_NAME || null)
      .input("TRAILER_TYPE_DESCRIPTION", sql.VarChar(50), data.TRAILER_TYPE_DESCRIPTION || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .input("LINK_ID", sql.Int, data.LINK_ID ?? null)
      .execute("VMaster.SAVE_TRAILER_TYPE_MASTER");
    const { message, data: newId } = parseSprocResult(result.recordset?.[0], "Failed to save trailer type");

    return { message: message || "Trailer type saved successfully", id: newId };
  } catch (error) {
    console.error("SAVE_TRAILER_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const updateTrailerTypeMasterService = async (data: TrailerTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("TRAILER_TYPE_ID", sql.Int, data.TRAILER_TYPE_ID ?? 0)
      .input("TRAILER_TYPE_NAME", sql.VarChar(50), data.TRAILER_TYPE_NAME ?? null)
      .input("TRAILER_TYPE_DESCRIPTION", sql.VarChar(50), data.TRAILER_TYPE_DESCRIPTION ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .input("LINK_ID", sql.Int, data.LINK_ID ?? null)
      .execute("VMaster.UPDATE_TRAILER_TYPE_MASTER");
    const { message, data: updatedId } = parseSprocResult(result.recordset?.[0], "Failed to update trailer type");

    return { message: message || "Trailer type updated successfully", id: updatedId };
  } catch (error) {
    console.error("UPDATE_TRAILER_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const deleteTrailerTypeMasterService = async (
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
      .input("TRAILER_TYPE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_TRAILER_TYPE_MASTER");
    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete");

    return { message: message || "Trailer type deleted successfully" };
  } catch (error) {
    console.error("DELETE_TRAILER_TYPE_MASTER SP error:", error);
    throw error;
  }
};
