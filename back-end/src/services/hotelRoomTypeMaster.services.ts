import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface HotelRoomTypeMasterData {
  ROOM_TYPE_ID?: number;
  ROOM_TYPE_NAME: string;
  DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const serializeRecordset = (rows: any[]) =>
  (rows || []).map((r: any) => ({ ...r, id: r.ROOM_TYPE_ID }));

export const getAllHotelRoomTypeMasterService = async (status?: string) => {
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
          .execute("VMaster.SHOW_HOTEL_ROOM_TYPE_MASTER");
        allRows = allRows.concat(result.recordset || []);
      }
      return serializeRecordset(allRows);
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(50), status)
      .execute("VMaster.SHOW_HOTEL_ROOM_TYPE_MASTER");
    return serializeRecordset(result.recordset || []);
  } catch (error) {
    console.error("SHOW_HOTEL_ROOM_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const getHotelRoomTypeMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("ROOM_TYPE_ID", sql.Int, id)
      .execute("VMaster.GET_HOTEL_ROOM_TYPE_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_HOTEL_ROOM_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const saveHotelRoomTypeMasterService = async (data: HotelRoomTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("ROOM_TYPE_ID", sql.Int, data.ROOM_TYPE_ID ?? 0)
      .input("ROOM_TYPE_NAME", sql.VarChar(100), data.ROOM_TYPE_NAME || null)
      .input("DESCRIPTION", sql.VarChar(500), data.DESCRIPTION || null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_HOTEL_ROOM_TYPE_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save hotel room type");

    return { message: message || "Data saved successfully", ROOM_TYPE_ID: savedData };
  } catch (error) {
    console.error("SAVE_HOTEL_ROOM_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const updateHotelRoomTypeMasterService = async (data: HotelRoomTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("ROOM_TYPE_ID", sql.Int, data.ROOM_TYPE_ID ?? 0)
      .input("ROOM_TYPE_NAME", sql.VarChar(100), data.ROOM_TYPE_NAME ?? null)
      .input("DESCRIPTION", sql.VarChar(500), data.DESCRIPTION ?? null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_HOTEL_ROOM_TYPE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update hotel room type");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_HOTEL_ROOM_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const deleteHotelRoomTypeMasterService = async (
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
      .input("ROOM_TYPE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_HOTEL_ROOM_TYPE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete hotel room type");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_HOTEL_ROOM_TYPE_MASTER SP error:", error);
    throw error;
  }
};