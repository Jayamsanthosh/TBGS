import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface DesignationMasterData {
  DESIGNATION_ID?: number;
  DESIGNATION_NAME: string;
  designation_group_id?: number;
  REMARKS: string;
  STATUS_MASTER: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

interface ProcRowResult {
  status: string;
  message: string;
  data: unknown;
}

const parseProcRow = (row: any): ProcRowResult => {
  if (!row) return { status: "", message: "", data: undefined };
  const values = Array.isArray(row[""]) ? (row[""] as any[]) : Object.values(row);
  const get = (index: number, name: string): any => {
    if (row[name] !== undefined) return row[name];
    if (row[String(index)] !== undefined) return row[String(index)];
    return values[index];
  };
  return {
    status: String(get(0, "STATUS") ?? ""),
    message: String(get(1, "MESSAGE") ?? ""),
    data: get(2, "DATA"),
  };
};

export const getAllDesignationMasterService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .execute("VMaster.SHOW_DESIGNATION_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_DESIGNATION_MASTER SP error:", error);
    throw error;
  }
};

export const getDesignationMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("DESIGNATION_ID", sql.Int, id)
      .execute("VMaster.GET_DESIGNATION_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_DESIGNATION_MASTER SP error:", error);
    throw error;
  }
};

export const saveDesignationMasterService = async (data: DesignationMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("DESIGNATION_ID", sql.Int, data.DESIGNATION_ID ?? 0)
      .input("DESIGNATION_NAME", sql.VarChar(200), data.DESIGNATION_NAME || null)
      .input("designation_group_id", sql.Int, data.designation_group_id ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(50), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_DESIGNATION_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to save designation");

    return { message: message || "Designation saved successfully" };
  } catch (error) {
    console.error("SAVE_DESIGNATION_MASTER SP error:", error);
    throw error;
  }
};

export const updateDesignationMasterService = async (data: DesignationMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("DESIGNATION_ID", sql.Int, data.DESIGNATION_ID ?? 0)
      .input("DESIGNATION_NAME", sql.VarChar(200), data.DESIGNATION_NAME ?? null)
      .input("designation_group_id", sql.Int, data.designation_group_id ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(50), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_DESIGNATION_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update designation");

    return { message: message || "Designation updated successfully" };
  } catch (error) {
    console.error("UPDATE_DESIGNATION_MASTER SP error:", error);
    throw error;
  }
};

export const deleteDesignationMasterService = async (
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
      .input("DESIGNATION_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_DESIGNATION_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete");

    return { message: message || "Designation deleted successfully" };
  } catch (error) {
    console.error("DELETE_DESIGNATION_MASTER SP error:", error);
    throw error;
  }
};
