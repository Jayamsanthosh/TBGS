import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface TrailerMasterFileData {
  SNO?: number;
  TRAILER_ID?: number;
  DOCUMENT_TYPE?: string;
  DESCRIPTIONS?: string;
  FILE_NAME?: string;
  CONTENT_TYPE?: string;
  CONTENT_DATA?: string | Buffer | null;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const toInt = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

const fileRequest = (pool: any, data: TrailerMasterFileData) => {
  const req = pool.request();
  req.input("SNO", sql.Int, toInt(data.SNO));
  req.input("TRAILER_ID", sql.Int, toInt(data.TRAILER_ID));
  req.input("DOCUMENT_TYPE", sql.VarChar(50), data.DOCUMENT_TYPE || null);
  req.input("DESCRIPTIONS", sql.VarChar(100), data.DESCRIPTIONS || null);
  req.input("FILE_NAME", sql.VarChar(150), data.FILE_NAME || null);
  req.input("CONTENT_TYPE", sql.VarChar(50), data.CONTENT_TYPE || null);
  req.input("CONTENT_DATA", sql.VarBinary(sql.MAX), typeof data.CONTENT_DATA === "string" ? Buffer.from(data.CONTENT_DATA, "base64") : (data.CONTENT_DATA ?? null));
  req.input("REMARKS", sql.VarChar(100), data.REMARKS || null);
  req.input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null);
  req.input("USER", sql.VarChar(50), data.USER || "Admin");
  req.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");
  return req;
};

export const getFilesByTrailerIdService = async (trailerId: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("TRAILER_ID", sql.Int, trailerId)
      .execute("VMaster.SHOW_TRAILER_MASTER_FILES_UPLOAD");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_TRAILER_MASTER_FILES_UPLOAD SP error:", error);
    throw error;
  }
};

export const getFileByIdService = async (sno: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, sno)
      .execute("VMaster.GET_TRAILER_MASTER_FILES_UPLOAD");
    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_TRAILER_MASTER_FILES_UPLOAD SP error:", error);
    throw error;
  }
};

export const saveFileService = async (data: TrailerMasterFileData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await fileRequest(pool, data).execute("VMaster.SAVE_TRAILER_MASTER_FILES_UPLOAD");
    const { status, message, data: id } = parseSprocResult(result.recordset?.[0], "Failed to upload file");
    return { message: message || "File uploaded successfully", SNO: id || Number(data.SNO ?? 0) };
  } catch (error) {
    console.error("SAVE_TRAILER_MASTER_FILES_UPLOAD SP error:", error);
    throw error;
  }
};

export const updateFileService = async (data: TrailerMasterFileData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await fileRequest(pool, data).execute("VMaster.UPDATE_TRAILER_MASTER_FILES_UPLOAD");
    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update file");
    return { message: message || "File updated successfully" };
  } catch (error) {
    console.error("UPDATE_TRAILER_MASTER_FILES_UPLOAD SP error:", error);
    throw error;
  }
};

export const deleteFileService = async (
  sno: number,
  user: string,
  role: string,
  macAddress: string
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, sno)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_TRAILER_MASTER_FILES_UPLOAD");
    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete");
    return { message: message || "File deleted successfully" };
  } catch (error) {
    console.error("DELETE_TRAILER_MASTER_FILES_UPLOAD SP error:", error);
    throw error;
  }
};
