import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface ParticipantTypeMasterData {
  PARTICIPANT_TYPE_ID?: number;
  PARTICIPANT_TYPE_NAME: string;
  PARTICIPANT_TYPE_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllParticipantTypeMasterService = async (status = "ALL") => {
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
          .execute("VMaster.SHOW_PARTICIPANT_TYPE_MASTER");
        allRows = allRows.concat(result.recordset || []);
      }
      return allRows;
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(50), status)
      .execute("VMaster.SHOW_PARTICIPANT_TYPE_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_PARTICIPANT_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const getParticipantTypeMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PARTICIPANT_TYPE_ID", sql.Int, id)
      .execute("VMaster.GET_PARTICIPANT_TYPE_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_PARTICIPANT_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const saveParticipantTypeMasterService = async (data: ParticipantTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PARTICIPANT_TYPE_ID", sql.Int, data.PARTICIPANT_TYPE_ID ?? 0)
      .input("PARTICIPANT_TYPE_NAME", sql.VarChar(50), data.PARTICIPANT_TYPE_NAME || null)
      .input("PARTICIPANT_TYPE_DESCRIPTION", sql.VarChar(50), data.PARTICIPANT_TYPE_DESCRIPTION || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_PARTICIPANT_TYPE_MASTER");

    const { message, data: id } = parseSprocResult(result.recordset?.[0], "Failed to save participant type");
    return { message: message || "Data saved successfully", PARTICIPANT_TYPE_ID: id };
  } catch (error) {
    console.error("SAVE_PARTICIPANT_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const updateParticipantTypeMasterService = async (data: ParticipantTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PARTICIPANT_TYPE_ID", sql.Int, data.PARTICIPANT_TYPE_ID ?? 0)
      .input("PARTICIPANT_TYPE_NAME", sql.VarChar(50), data.PARTICIPANT_TYPE_NAME ?? null)
      .input("PARTICIPANT_TYPE_DESCRIPTION", sql.VarChar(50), data.PARTICIPANT_TYPE_DESCRIPTION ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_PARTICIPANT_TYPE_MASTER");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to update participant type");
    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_PARTICIPANT_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const deleteParticipantTypeMasterService = async (
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
      .input("PARTICIPANT_TYPE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_PARTICIPANT_TYPE_MASTER");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to delete participant type");
    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_PARTICIPANT_TYPE_MASTER SP error:", error);
    throw error;
  }
};