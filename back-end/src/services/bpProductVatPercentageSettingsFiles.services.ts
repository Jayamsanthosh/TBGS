import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface BpProductVatFileData {
  SNO?: number;
  BP_PROD_VAT_ID?: number;
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

const toBase64 = (value: any): string | null => {
  if (value === undefined || value === null) return null;
  if (Buffer.isBuffer(value)) return value.toString("base64");
  if (typeof value === "string") return value;
  return null;
};

const buildRequest = (pool: any, data: BpProductVatFileData, includeId = true) => {
  const req = pool.request();
  if (includeId) {
    req.input("SNO", sql.Int, toInt(data.SNO));
  }
  req.input("BP_PROD_VAT_ID", sql.Int, toInt(data.BP_PROD_VAT_ID));
  req.input("DOCUMENT_TYPE", sql.VarChar(50), data.DOCUMENT_TYPE || null);
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

const serializeListRow = (r: any): any => ({ ...r, id: r.SNO, CONTENT_DATA: null });

export const getFilesBySettingService = async (settingId: number, status?: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    if (status === "ALL" || !status) {
      const statuses = ["AC", "IN"];
      let allRows: any[] = [];
      for (const s of statuses) {
        const result = await pool
          .request()
          .input("BP_PROD_VAT_ID", sql.Int, settingId)
          .input("STATUS", sql.VarChar(20), s)
          .execute("VMaster.SHOW_BP_PRODUCT_VAT_PERCENTAGE_SETTINGS_FILES_UPLOAD");
        allRows = allRows.concat(result.recordset || []);
      }
      return allRows.map(serializeListRow);
    }

    const result = await pool
      .request()
      .input("BP_PROD_VAT_ID", sql.Int, settingId)
      .input("STATUS", sql.VarChar(20), status)
      .execute("VMaster.SHOW_BP_PRODUCT_VAT_PERCENTAGE_SETTINGS_FILES_UPLOAD");
    return (result.recordset || []).map(serializeListRow);
  } catch (error) {
    console.error("SHOW_BP_PRODUCT_VAT_PERCENTAGE_SETTINGS_FILES_UPLOAD SP error:", error);
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
      .execute("VMaster.GET_BP_PRODUCT_VAT_PERCENTAGE_SETTINGS_FILES_UPLOAD");
    const row = result.recordset[0] || null;
    if (!row) return null;
    return { ...row, id: row.SNO, CONTENT_DATA: toBase64(row.CONTENT_DATA) };
  } catch (error) {
    console.error("GET_BP_PRODUCT_VAT_PERCENTAGE_SETTINGS_FILES_UPLOAD SP error:", error);
    throw error;
  }
};

export const saveFileService = async (data: BpProductVatFileData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await buildRequest(pool, data, true).execute(
      "VMaster.SAVE_BP_PRODUCT_VAT_PERCENTAGE_SETTINGS_FILES_UPLOAD"
    );

    const { message, data: id } = parseSprocResult(result.recordset?.[0], "Failed to upload file");
    return { message: message || "File uploaded successfully", SNO: id || Number(data.SNO ?? 0) };
  } catch (error) {
    console.error("SAVE_BP_PRODUCT_VAT_PERCENTAGE_SETTINGS_FILES_UPLOAD SP error:", error);
    const msg = (error as any)?.message || "";
    if (msg.includes("FILE NAME ALREADY EXISTS")) {
      throw new Error("FILE NAME ALREADY EXISTS");
    }
    if ((error as any)?.number === 547 || msg.includes("FOREIGN KEY") || msg.includes("FK_")) {
      throw new Error("Cannot save: Setting record does not exist.");
    }
    throw error;
  }
};

export const updateFileService = async (data: BpProductVatFileData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await buildRequest(pool, data, true).execute(
      "VMaster.UPDATE_BP_PRODUCT_VAT_PERCENTAGE_SETTINGS_FILES_UPLOAD"
    );

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to update file");
    return { message: message || "File updated successfully" };
  } catch (error) {
    console.error("UPDATE_BP_PRODUCT_VAT_PERCENTAGE_SETTINGS_FILES_UPLOAD SP error:", error);
    const msg = (error as any)?.message || "";
    if (msg.includes("FILE NAME ALREADY EXISTS")) {
      throw new Error("FILE NAME ALREADY EXISTS");
    }
    if ((error as any)?.number === 547 || msg.includes("FOREIGN KEY") || msg.includes("FK_")) {
      throw new Error("Cannot update: Setting record does not exist.");
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
      .execute("VMaster.DELETE_BP_PRODUCT_VAT_PERCENTAGE_SETTINGS_FILES_UPLOAD");

    const { message } = parseSprocResult(result.recordset?.[0], "No rights to delete");
    return { message: message || "File deleted successfully" };
  } catch (error) {
    console.error("DELETE_BP_PRODUCT_VAT_PERCENTAGE_SETTINGS_FILES_UPLOAD SP error:", error);
    throw error;
  }
};
