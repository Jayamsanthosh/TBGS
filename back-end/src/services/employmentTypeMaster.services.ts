import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface EmploymentTypeMasterData {
  EMPLOYMENT_TYPE_ID?: number;
  EMPLOYMENT_TYPE_NAME: string;
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

export const getAllEmploymentTypeMasterService = async (status = "ALL") => {
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
          .execute("VMaster.SHOW_EMPLOYMENT_TYPE_MASTER");
        allRows = allRows.concat(result.recordset || []);
      }
      return allRows.map(normalizeRow);
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(20), status)
      .execute("VMaster.SHOW_EMPLOYMENT_TYPE_MASTER");
    return (result.recordset || []).map(normalizeRow);
  } catch (error) {
    console.error("SHOW_EMPLOYMENT_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const getEmploymentTypeMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("EMPLOYMENT_TYPE_ID", sql.Int, id)
      .execute("VMaster.GET_EMPLOYMENT_TYPE_MASTER");

    const row = result.recordset[0] || null;
    return row ? normalizeRow(row) : null;
  } catch (error) {
    console.error("GET_EMPLOYMENT_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const saveEmploymentTypeMasterService = async (data: EmploymentTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .output("EMPLOYMENT_TYPE_ID", sql.Int)
      .input("EMPLOYMENT_TYPE_NAME", sql.VarChar(50), data.EMPLOYMENT_TYPE_NAME || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_EMPLOYMENT_TYPE_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save employment type");

    const newId = result.output?.EMPLOYMENT_TYPE_ID ?? savedData;
    return { message: message || "Data saved successfully", EMPLOYMENT_TYPE_ID: newId };
  } catch (error) {
    console.error("SAVE_EMPLOYMENT_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const updateEmploymentTypeMasterService = async (data: EmploymentTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const existing = await getEmploymentTypeMasterByIdService(data.EMPLOYMENT_TYPE_ID ?? 0);
    if (!existing) {
      throw new Error("RECORD DOES NOT EXIST");
    }

    const result = await pool
      .request()
      .input("EMPLOYMENT_TYPE_ID", sql.Int, data.EMPLOYMENT_TYPE_ID ?? 0)
      .input("EMPLOYMENT_TYPE_NAME", sql.VarChar(50), data.EMPLOYMENT_TYPE_NAME ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_EMPLOYMENT_TYPE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update employment type");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_EMPLOYMENT_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const deleteEmploymentTypeMasterService = async (
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
      .input("EMPLOYMENT_TYPE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_EMPLOYMENT_TYPE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete employment type");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_EMPLOYMENT_TYPE_MASTER SP error:", error);
    throw error;
  }
};