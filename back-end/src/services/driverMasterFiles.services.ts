import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface DriverMasterFileData {
  SNO?: number;
  DRIVER_EMP_ID?: number;
  DOCUMENT_TYPE?: string;
  ISSUE_DATE?: Date | string | null;
  EXPIRY_DATE?: Date | string | null;
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

const toDateTime = (value?: Date | string | null): Date | null => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const toBase64 = (value: any): string | null => {
  if (value === undefined || value === null) return null;
  if (Buffer.isBuffer(value)) return value.toString("base64");
  if (typeof value === "string") return value;
  return null;
};

const buildRequest = (pool: any, data: DriverMasterFileData, includeId = true) => {
  const req = pool.request();
  if (includeId) {
    req.input("SNO", sql.Int, toInt(data.SNO));
  }
  req.input("DRIVER_EMP_ID", sql.Int, toInt(data.DRIVER_EMP_ID));
  req.input("DOCUMENT_TYPE", sql.VarChar(50), data.DOCUMENT_TYPE || null);
  req.input("ISSUE_DATE", sql.DateTime, toDateTime(data.ISSUE_DATE));
  req.input("EXPIRY_DATE", sql.DateTime, toDateTime(data.EXPIRY_DATE));
  req.input("DESCRIPTIONS", sql.VarChar(100), data.DESCRIPTIONS || null);
  req.input("FILE_NAME", sql.VarChar(150), data.FILE_NAME || null);
  req.input("CONTENT_TYPE", sql.VarChar(50), data.CONTENT_TYPE || null);
  req.input(
    "CONTENT_DATA",
    sql.VarBinary(sql.MAX),
    typeof data.CONTENT_DATA === "string" && data.CONTENT_DATA !== ""
      ? Buffer.from(data.CONTENT_DATA, "base64")
      : (data.CONTENT_DATA ?? null)
  );
  req.input("REMARKS", sql.VarChar(100), data.REMARKS || null);
  req.input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null);
  req.input("USER", sql.VarChar(50), data.USER || "Admin");
  req.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");
  return req;
};

const serializeListRow = (r: any): any => ({ ...r, id: r.SNO });

export const getAllFilesService = async (status?: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .execute("VMaster.SHOW_DRIVER_MASTER_FILES_UPLOAD");
    let rows: any[] = result.recordset || [];
    if (status && status !== "ALL") {
      const s = String(status).toUpperCase().trim();
      rows = rows.filter((r: any) => String(r.STATUS_MASTER ?? "").toUpperCase().trim() === s);
    }
    return rows.map(serializeListRow);
  } catch (error) {
    console.error("SHOW_DRIVER_MASTER_FILES_UPLOAD SP error:", error);
    throw error;
  }
};

export const getFilesByDriverService = async (driverEmpId: number, status?: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .execute("VMaster.SHOW_DRIVER_MASTER_FILES_UPLOAD");
    let rows: any[] = (result.recordset || []).filter(
      (r: any) => Number(r.DRIVER_EMP_ID) === Number(driverEmpId)
    );
    if (status && status !== "ALL") {
      const s = String(status).toUpperCase().trim();
      rows = rows.filter((r: any) => String(r.STATUS_MASTER ?? "").toUpperCase().trim() === s);
    }
    return rows.map(serializeListRow);
  } catch (error) {
    console.error("SHOW_DRIVER_MASTER_FILES_UPLOAD SP error:", error);
    throw error;
  }
};

export const getFileByIdService = async (
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
      .execute("VMaster.GET_DRIVER_MASTER_FILES_UPLOAD");
    const row = result.recordset[0] || null;
    if (!row) return null;
    return { ...row, id: row.SNO, CONTENT_DATA: toBase64(row.CONTENT_DATA) };
  } catch (error) {
    console.error("GET_DRIVER_MASTER_FILES_UPLOAD SP error:", error);
    throw error;
  }
};

export const saveFileService = async (data: DriverMasterFileData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const request = buildRequest(pool, data, false);
    request.output("SNO", sql.Int);
    const result = await request.execute("VMaster.SAVE_DRIVER_MASTER_FILES_UPLOAD");

    const { status, message, data: id } = parseSprocResult(result.recordset?.[0], "Failed to upload file");

    const newId = id || result.output?.SNO || Number(data.SNO ?? 0);
    return { message: message || "File uploaded successfully", SNO: newId };
  } catch (error) {
    console.error("SAVE_DRIVER_MASTER_FILES_UPLOAD SP error:", error);
    const msg = (error as any)?.message || "";
    if ((error as any)?.number === 547 || msg.includes("FOREIGN KEY") || msg.includes("FK_")) {
      throw new Error("Cannot save: Driver does not exist.");
    }
    throw error;
  }
};

export const updateFileService = async (data: DriverMasterFileData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await buildRequest(pool, data, true).execute(
      "VMaster.UPDATE_DRIVER_MASTER_FILES_UPLOAD"
    );

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update file");

    return { message: message || "File updated successfully" };
  } catch (error) {
    console.error("UPDATE_DRIVER_MASTER_FILES_UPLOAD SP error:", error);
    const msg = (error as any)?.message || "";
    if ((error as any)?.number === 547 || msg.includes("FOREIGN KEY") || msg.includes("FK_")) {
      throw new Error("Cannot update: Driver does not exist.");
    }
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
      .execute("VMaster.DELETE_DRIVER_MASTER_FILES_UPLOAD");

    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete");

    return { message: message || "File deleted successfully" };
  } catch (error) {
    console.error("DELETE_DRIVER_MASTER_FILES_UPLOAD SP error:", error);
    throw error;
  }
};
