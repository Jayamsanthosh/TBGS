import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface AttendanceTypeMasterData {
  ATTENDANCE_TYPE_ID?: number;
  ATTENDANCE_TYPE_NAME: string;
  ELIGIBLE_DAYS?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const normalizeRow = (r: any) => ({
  ...r,
  STATUS_MASTER: r.STATUS_MASTER ?? r.STATUS ?? null,
});

const getStatus = (r: any) => r?.STATUS ?? r?.[""]?.[0] ?? "";
const getMessage = (r: any) => r?.MESSAGE ?? r?.[""]?.[1] ?? "";
const getData = (r: any) => r?.DATA ?? r?.[""]?.[2] ?? "";

export const getAllAttendanceTypeMasterService = async (status = "ALL") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    if (status === "ALL") {
      const statuses = ["AC", "IN"];
      let allRows: any[] = [];
      for (const s of statuses) {
        const result = await pool
          .request()
          .input("STATUS", sql.VarChar(20), s)
          .execute("VMaster.SHOW_ATTENDANCE_TYPE_MASTER");
        allRows = allRows.concat(result.recordset || []);
      }
      return allRows.map(normalizeRow);
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(20), status)
      .execute("VMaster.SHOW_ATTENDANCE_TYPE_MASTER");
    return (result.recordset || []).map(normalizeRow);
  } catch (error) {
    console.error("SHOW_ATTENDANCE_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const getAttendanceTypeMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("ATTENDANCE_TYPE_ID", sql.Int, id)
      .execute("VMaster.GET_ATTENDANCE_TYPE_MASTER");

    const row = result.recordset[0] || null;
    return row ? normalizeRow(row) : null;
  } catch (error) {
    console.error("GET_ATTENDANCE_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const saveAttendanceTypeMasterService = async (data: AttendanceTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("ATTENDANCE_TYPE_ID", sql.Int, 0)
      .input("ATTENDANCE_TYPE_NAME", sql.VarChar(50), data.ATTENDANCE_TYPE_NAME || null)
      .input("ELIGIBLE_DAYS", sql.Int, data.ELIGIBLE_DAYS ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_ATTENDANCE_TYPE_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save attendance type");

    const dataValue = savedData;
    return {
      message: message || "Data saved successfully",
      ATTENDANCE_TYPE_ID: dataValue !== undefined && dataValue !== null && dataValue !== "" ? Number(dataValue) : undefined,
    };
  } catch (error) {
    console.error("SAVE_ATTENDANCE_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const updateAttendanceTypeMasterService = async (data: AttendanceTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const existing = await getAttendanceTypeMasterByIdService(data.ATTENDANCE_TYPE_ID ?? 0);
    if (!existing) {
      throw new Error("RECORD DOES NOT EXIST");
    }

    const result = await pool
      .request()
      .input("ATTENDANCE_TYPE_ID", sql.Int, data.ATTENDANCE_TYPE_ID ?? 0)
      .input("ATTENDANCE_TYPE_NAME", sql.VarChar(50), data.ATTENDANCE_TYPE_NAME || null)
      .input("ELIGIBLE_DAYS", sql.Int, data.ELIGIBLE_DAYS ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.UPDATE_ATTENDANCE_TYPE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update attendance type");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_ATTENDANCE_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const deleteAttendanceTypeMasterService = async (
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
      .input("ATTENDANCE_TYPE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_ATTENDANCE_TYPE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete attendance type");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_ATTENDANCE_TYPE_MASTER SP error:", error);
    throw error;
  }
};