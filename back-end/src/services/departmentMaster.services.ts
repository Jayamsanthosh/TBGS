import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface DepartmentMasterData {
  DEPARTMENT_ID?: number;
  DEPARTMENT_NAME: string;
  REMARKS: string;
  STATUS_MASTER: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllDepartmentMasterService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .execute("VMaster.SHOW_DEPARTMENT_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_DEPARTMENT_MASTER SP error:", error);
    throw error;
  }
};

export const getDepartmentMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("DEPARTMENT_ID", sql.Int, id)
      .execute("VMaster.GET_DEPARTMENT_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_DEPARTMENT_MASTER SP error:", error);
    throw error;
  }
};

export const saveDepartmentMasterService = async (data: DepartmentMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("DEPARTMENT_ID", sql.Int, data.DEPARTMENT_ID ?? 0)
      .input("DEPARTMENT_NAME", sql.VarChar(200), data.DEPARTMENT_NAME || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(50), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_DEPARTMENT_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to save department");

    return { message: message || "Department saved successfully" };
  } catch (error) {
    console.error("SAVE_DEPARTMENT_MASTER SP error:", error);
    throw error;
  }
};

export const updateDepartmentMasterService = async (data: DepartmentMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("DEPARTMENT_ID", sql.Int, data.DEPARTMENT_ID ?? 0)
      .input("DEPARTMENT_NAME", sql.VarChar(200), data.DEPARTMENT_NAME ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(50), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_DEPARTMENT_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update department");

    return { message: message || "Department updated successfully" };
  } catch (error) {
    console.error("UPDATE_DEPARTMENT_MASTER SP error:", error);
    throw error;
  }
};

export const deleteDepartmentMasterService = async (
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
      .input("DEPARTMENT_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_DEPARTMENT_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete");

    return { message: message || "Department deleted successfully" };
  } catch (error) {
    console.error("DELETE_DEPARTMENT_MASTER SP error:", error);
    throw error;
  }
};
