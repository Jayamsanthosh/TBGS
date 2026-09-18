import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface DMSFileData {
  DMS_ID?: number;
  LINK_PAGES_ID?: number;
  PAGE_REF_NO?: string;
  DOCUMENT_TYPE?: string;
  DESCRIPTIONS?: string;
  FILE_NAME?: string;
  CONTENT_TYPE?: string;
  CONTENT_DATA?: string | Buffer | null;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
}

const toInt = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

const toBase64 = (value: any): string | null => {
  if (value === undefined || value === null) return null;
  if (Buffer.isBuffer(value)) return value.toString("base64");
  if (typeof value === "string") return value;
  return null;
};

const serializeListRow = (r: any): any => ({ ...r, id: r.DMS_ID, CONTENT_DATA: null });

export const getAllDocumentsService = async (status?: string, linkPagesId?: number, pageRefNo?: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    let statuses = ["AC", "IN"];
    if (status && status !== "ALL") {
      statuses = [status];
    }

    let allRows: any[] = [];
    for (const s of statuses) {
      const result = await pool
        .request()
        .input("STATUS", sql.VarChar(20), s)
        .execute("VMaster.SHOW_DOCUMENT_MANAGEMENT_SYSTEM");
      allRows = allRows.concat(result.recordset || []);
    }
    
    // Filter if needed
    if (linkPagesId !== undefined) {
      allRows = allRows.filter(r => r.LINK_PAGES_ID === linkPagesId);
    }
    if (pageRefNo) {
      allRows = allRows.filter(r => String(r.PAGE_REF_NO) === String(pageRefNo));
    }

    return allRows.map(serializeListRow);
  } catch (error) {
    console.error("SHOW_DOCUMENT_MANAGEMENT_SYSTEM SP error:", error);
    throw error;
  }
};

export const getDocumentByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("DMS_ID", sql.Int, id)
      .execute("VMaster.GET_DOCUMENT_MANAGEMENT_SYSTEM");
    const row = result.recordset[0] || null;
    if (!row) return null;
    return { ...row, id: row.DMS_ID, CONTENT_DATA: toBase64(row.CONTENT_DATA) };
  } catch (error) {
    console.error("GET_DOCUMENT_MANAGEMENT_SYSTEM SP error:", error);
    throw error;
  }
};

const executeDocument = async (pool: any, data: DMSFileData, spName: string, isUpdate: boolean) => {
  const contentBuffer =
    typeof data.CONTENT_DATA === "string" && data.CONTENT_DATA !== ""
      ? Buffer.from(data.CONTENT_DATA, "base64")
      : Buffer.isBuffer(data.CONTENT_DATA)
        ? data.CONTENT_DATA
        : null;

  const req = pool.request();
  req.input("DMS_ID", sql.Int, isUpdate ? toInt(data.DMS_ID) : 0);
  req.input("LINK_PAGES_ID", sql.Int, toInt(data.LINK_PAGES_ID));
  req.input("PAGE_REF_NO", sql.VarChar(50), data.PAGE_REF_NO || null);
  req.input("DOCUMENT_TYPE", sql.VarChar(50), data.DOCUMENT_TYPE || null);
  req.input("DESCRIPTIONS", sql.VarChar(500), data.DESCRIPTIONS || null);
  req.input("FILE_NAME", sql.VarChar(150), data.FILE_NAME || null);
  req.input("CONTENT_TYPE", sql.VarChar(50), data.CONTENT_TYPE || null);
  req.input("CONTENT_DATA", sql.VarBinary(sql.MAX), contentBuffer);
  req.input("REMARKS", sql.VarChar(100), data.REMARKS || null);
  req.input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || "AC");
  req.input("USER", sql.VarChar(50), data.USER || "Admin");
  req.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

  return req.execute(spName);
};

export const saveDocumentService = async (data: DMSFileData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await executeDocument(pool, data, "VMaster.SAVE_DOCUMENT_MANAGEMENT_SYSTEM", false);
    
    const { status, message, data: id } = parseSprocResult(result.recordset?.[0], "Failed to upload file");

    const newId = id || Number(data.DMS_ID ?? 0);
    return { message: message || "File uploaded successfully", DMS_ID: newId };
  } catch (error) {
    console.error("SAVE_DOCUMENT_MANAGEMENT_SYSTEM SP error:", error);
    throw error;
  }
};

export const updateDocumentService = async (data: DMSFileData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await executeDocument(pool, data, "VMaster.UPDATE_DOCUMENT_MANAGEMENT_SYSTEM", true);

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update file");

    return { message: message || "File updated successfully" };
  } catch (error) {
    console.error("UPDATE_DOCUMENT_MANAGEMENT_SYSTEM SP error:", error);
    throw error;
  }
};

export const deleteDocumentService = async (
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
      .input("DMS_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_DOCUMENT_MANAGEMENT_SYSTEM");

    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete");

    return { message: message || "File deleted successfully" };
  } catch (error) {
    console.error("DELETE_DOCUMENT_MANAGEMENT_SYSTEM SP error:", error);
    throw error;
  }
};
