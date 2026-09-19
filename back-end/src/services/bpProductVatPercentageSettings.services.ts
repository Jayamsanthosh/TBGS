import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface BpProductVatData {
  BP_PROD_VAT_ID?: number;
  COMPANY_ID?: number;
  BP_ID?: number;
  MAIN_CATEGORY_ID?: number;
  SUB_CATEGORY_ID?: number;
  PRODUCT_ID?: number;
  VAT_PERCENTAGE?: number | string;
  EFFECTIVE_FROM?: Date | string | null;
  EFFECTIVE_TO?: Date | string | null;
  REQUEST_STATUS?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const STATUSES = ["AC", "IN", "CL", "CA"];

const serialize = (rows: any[]) => (rows || []).map((r: any) => ({ ...r, id: r.BP_PROD_VAT_ID }));

const attachFileCounts = async (rows: any[]): Promise<any[]> => {
  if (!rows || rows.length === 0) return rows;
  const pool = getPool();
  if (!pool) return rows;
  const result = await pool.request().query(`
    SELECT F.BP_PROD_VAT_ID, COUNT(*) AS FILE_COUNT
    FROM VMaster.TBL_BP_PRODUCT_VAT_PERCENTAGE_SETTINGS_FILES_UPLOAD F
    GROUP BY F.BP_PROD_VAT_ID
  `);
  const counts = new Map<number, number>(
    (result.recordset || []).map((r: any) => [Number(r.BP_PROD_VAT_ID), Number(r.FILE_COUNT) || 0])
  );
  return (rows || []).map((r: any) => ({ ...r, FILE_COUNT: counts.get(Number(r.BP_PROD_VAT_ID)) ?? 0 }));
};

const toDateTime = (value?: Date | string | null): Date | null => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const toDecimal = (value?: number | string): number | null => {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
};

const buildRequest = (pool: any, data: BpProductVatData, includeId = true) => {
  const req = pool.request();
  if (includeId) {
    req.input("BP_PROD_VAT_ID", sql.Int, data.BP_PROD_VAT_ID ?? null);
  }
  req.input("COMPANY_ID", sql.Int, data.COMPANY_ID ?? null);
  req.input("BP_ID", sql.Int, data.BP_ID ?? null);
  req.input("MAIN_CATEGORY_ID", sql.Int, data.MAIN_CATEGORY_ID ?? null);
  req.input("SUB_CATEGORY_ID", sql.Int, data.SUB_CATEGORY_ID ?? null);
  req.input("PRODUCT_ID", sql.Int, data.PRODUCT_ID ?? null);
  req.input("VAT_PERCENTAGE", sql.Decimal(10, 2), toDecimal(data.VAT_PERCENTAGE));
  req.input("EFFECTIVE_FROM", sql.DateTime, toDateTime(data.EFFECTIVE_FROM));
  req.input("EFFECTIVE_TO", sql.DateTime, toDateTime(data.EFFECTIVE_TO));
  req.input("REQUEST_STATUS", sql.VarChar(50), data.REQUEST_STATUS || null);
  req.input("REMARKS", sql.VarChar(100), data.REMARKS || null);
  req.input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null);
  req.input("USER", sql.VarChar(50), data.USER || "Admin");
  req.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");
  return req;
};

export const getAllService = async (status?: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    if (status === "ALL" || !status) {
      let allRows: any[] = [];
      for (const s of STATUSES) {
        const result = await pool
          .request()
          .input("STATUS", sql.VarChar(20), s)
          .execute("VMaster.SHOW_BP_PRODUCT_VAT_PERCENTAGE_SETTINGS_HDR");
        allRows = allRows.concat(result.recordset || []);
      }
      return serialize(await attachFileCounts(allRows));
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(20), status)
      .execute("VMaster.SHOW_BP_PRODUCT_VAT_PERCENTAGE_SETTINGS_HDR");
    return serialize(await attachFileCounts(result.recordset || []));
  } catch (error) {
    console.error("SHOW_BP_PRODUCT_VAT_PERCENTAGE_SETTINGS_HDR SP error:", error);
    throw error;
  }
};

export const getByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("BP_PROD_VAT_ID", sql.Int, id)
      .execute("VMaster.GET_BP_PRODUCT_VAT_PERCENTAGE_SETTINGS_HDR");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_BP_PRODUCT_VAT_PERCENTAGE_SETTINGS_HDR SP error:", error);
    throw error;
  }
};

export const saveService = async (data: BpProductVatData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await buildRequest(pool, data, true).execute(
      "VMaster.SAVE_BP_PRODUCT_VAT_PERCENTAGE_SETTINGS_HDR"
    );

    const { message, data: id } = parseSprocResult(result.recordset?.[0], "Failed to save record");
    return { message: message || "Data saved successfully", BP_PROD_VAT_ID: id };
  } catch (error) {
    console.error("SAVE_BP_PRODUCT_VAT_PERCENTAGE_SETTINGS_HDR SP error:", error);
    const msg = (error as any)?.message || "";
    if (msg.includes("Record Already Exists") || msg.includes("duplicate")) {
      throw new Error("Record Already Exists");
    }
    if ((error as any)?.number === 547 || msg.includes("FOREIGN KEY") || msg.includes("FK_")) {
      throw new Error("Cannot save: referenced master record does not exist.");
    }
    throw error;
  }
};

export const updateService = async (data: BpProductVatData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await buildRequest(pool, data).execute(
      "VMaster.UPDATE_BP_PRODUCT_VAT_PERCENTAGE_SETTINGS_HDR"
    );

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to update record");
    return { message: message || "Data updated successfully" };
  } catch (error) {
    console.error("UPDATE_BP_PRODUCT_VAT_PERCENTAGE_SETTINGS_HDR SP error:", error);
    const msg = (error as any)?.message || "";
    if (msg.includes("Record Already Exists") || msg.includes("duplicate")) {
      throw new Error("Record Already Exists");
    }
    if ((error as any)?.number === 547 || msg.includes("FOREIGN KEY") || msg.includes("FK_")) {
      throw new Error("Cannot update: referenced master record does not exist.");
    }
    throw error;
  }
};

export const deleteService = async (id: number, user: string, role: string, macAddress: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("BP_PROD_VAT_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_BP_PRODUCT_VAT_PERCENTAGE_SETTINGS_HDR");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to delete record");
    return { message: message || "Data deleted successfully" };
  } catch (error) {
    console.error("DELETE_BP_PRODUCT_VAT_PERCENTAGE_SETTINGS_HDR SP error:", error);
    const msg = (error as any)?.message || "";
    if (msg.includes("REFERENCE constraint") || msg.includes("FK_")) {
      throw new Error("Cannot delete: This record has associated data.");
    }
    throw error;
  }
};

export const submitService = async (id: number, role: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("BP_PROD_VAT_ID", sql.Int, id)
      .input("Role", sql.VarChar(50), role || "Administrator")
      .execute("VMaster.SUBMIT_BP_PRODUCT_VAT_PERCENTAGE_SETTINGS_HDR");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to submit record");
    return { message: message || "Submitted successfully", STATUS_MASTER: "CL" };
  } catch (error) {
    console.error("SUBMIT_BP_PRODUCT_VAT_PERCENTAGE_SETTINGS_HDR SP error:", error);
    throw error;
  }
};
