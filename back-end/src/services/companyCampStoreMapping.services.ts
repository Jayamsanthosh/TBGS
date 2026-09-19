import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface CompanyCampStoreMappingData {
  MAP_ID?: number;
  COMPANY_ID: number;
  CAMP_ID: number;
  STORE_ID: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const serializeRecordset = (rows: any[]) =>
  (rows || []).map((r: any) => ({ ...r, id: r.MAP_ID }));

const normalizeStatus = (status: string | undefined | null): string => {
  if (!status) return 'AC';
  const s = status.trim().toUpperCase();
  if (s === 'ACTIVE' || s === 'AC') return 'AC';
  if (s === 'INACTIVE' || s === 'IA' || s === 'IN') return 'IA';
  return s.substring(0, 2);
};

export const getAllMappingService = async (status?: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const statuses =
      !status || status.toUpperCase() === "ALL"
        ? ["AC", "IA", "ACTIVE", "INACTIVE"]
        : [status];

    let allRows: any[] = [];
    for (const s of statuses) {
      const result = await pool
        .request()
        .input("STATUS", sql.VarChar(20), s)
        .execute("VMaster.SHOW_COMPANY_CAMP_STORE_MAPPING");
      allRows = allRows.concat(result.recordset || []);
    }

    const seen = new Set<number>();
    const uniqueRows = allRows.filter((r) => {
      const key = Number(r.MAP_ID);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return serializeRecordset(uniqueRows);
  } catch (error) {
    console.error("SHOW_COMPANY_CAMP_STORE_MAPPING SP error:", error);
    throw error;
  }
};

export const getMappingByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("MAP_ID", sql.Int, id)
      .execute("VMaster.GET_COMPANY_CAMP_STORE_MAPPING");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_COMPANY_CAMP_STORE_MAPPING SP error:", error);
    throw error;
  }
};

export const saveMappingService = async (data: CompanyCampStoreMappingData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("MAP_ID", sql.Int, data.MAP_ID ?? 0)
      .input("COMPANY_ID", sql.Int, data.COMPANY_ID ?? null)
      .input("CAMP_ID", sql.Int, data.CAMP_ID ?? null)
      .input("STORE_ID", sql.Int, data.STORE_ID ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), normalizeStatus(data.STATUS_MASTER))
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_COMPANY_CAMP_STORE_MAPPING");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save mapping");

    return { message: message || "Data saved successfully", MAP_ID: savedData };
  } catch (error) {
    console.error("SAVE_COMPANY_CAMP_STORE_MAPPING SP error:", error);
    throw error;
  }
};

export const updateMappingService = async (data: CompanyCampStoreMappingData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("MAP_ID", sql.Int, data.MAP_ID ?? 0)
      .input("COMPANY_ID", sql.Int, data.COMPANY_ID ?? null)
      .input("CAMP_ID", sql.Int, data.CAMP_ID ?? null)
      .input("STORE_ID", sql.Int, data.STORE_ID ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), normalizeStatus(data.STATUS_MASTER))
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.UPDATE_COMPANY_CAMP_STORE_MAPPING");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update mapping");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_COMPANY_CAMP_STORE_MAPPING SP error:", error);
    throw error;
  }
};

export const deleteMappingService = async (
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
      .input("MAP_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_COMPANY_CAMP_STORE_MAPPING");

    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete");

    return { message: message || "Data deleted successfully" };
  } catch (error) {
    console.error("DELETE_COMPANY_CAMP_STORE_MAPPING SP error:", error);
    throw error;
  }
};