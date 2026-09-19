import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface BookingSourceMasterData {
  BOOKING_SOURCE_ID?: number;
  BOOKING_SOURCE_NAME: string;
  BOOKING_SOURCE_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllBookingSourceMasterService = async (status = "ALL") => {
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
          .execute("VMaster.SHOW_BOOKING_SOURCE_MASTER");
        allRows = allRows.concat(result.recordset || []);
      }
      return allRows;
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(50), status)
      .execute("VMaster.SHOW_BOOKING_SOURCE_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_BOOKING_SOURCE_MASTER SP error:", error);
    throw error;
  }
};

export const getBookingSourceMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("BOOKING_SOURCE_ID", sql.Int, id)
      .execute("VMaster.GET_BOOKING_SOURCE_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_BOOKING_SOURCE_MASTER SP error:", error);
    throw error;
  }
};

export const saveBookingSourceMasterService = async (data: BookingSourceMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("BOOKING_SOURCE_ID", sql.Int, data.BOOKING_SOURCE_ID ?? 0)
      .input("BOOKING_SOURCE_NAME", sql.VarChar(50), data.BOOKING_SOURCE_NAME || null)
      .input("BOOKING_SOURCE_DESCRIPTION", sql.VarChar(50), data.BOOKING_SOURCE_DESCRIPTION || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_BOOKING_SOURCE_MASTER");

    const { message, data: id } = parseSprocResult(result.recordset?.[0], "Failed to save booking source");
    return { message: message || "Data saved successfully", BOOKING_SOURCE_ID: id };
  } catch (error) {
    console.error("SAVE_BOOKING_SOURCE_MASTER SP error:", error);
    throw error;
  }
};

export const updateBookingSourceMasterService = async (data: BookingSourceMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("BOOKING_SOURCE_ID", sql.Int, data.BOOKING_SOURCE_ID ?? 0)
      .input("BOOKING_SOURCE_NAME", sql.VarChar(50), data.BOOKING_SOURCE_NAME ?? null)
      .input("BOOKING_SOURCE_DESCRIPTION", sql.VarChar(50), data.BOOKING_SOURCE_DESCRIPTION ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_BOOKING_SOURCE_MASTER");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to update booking source");
    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_BOOKING_SOURCE_MASTER SP error:", error);
    throw error;
  }
};

export const deleteBookingSourceMasterService = async (
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
      .input("BOOKING_SOURCE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_BOOKING_SOURCE_MASTER");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to delete booking source");
    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_BOOKING_SOURCE_MASTER SP error:", error);
    throw error;
  }
};