import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface EmployeeWorkingStatusMasterData {
  EMP_CURRENT_STATUS_ID?: number;
  EMP_CURRENT_STATUS_NAME: string;
  REMARKS?: string;
  STATUS_MASTER: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllEmployeeWorkingStatusMasterService = async (status?: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const request = pool.request();
    if (status) {
      request.input("status", sql.VarChar(2), status);
    }
    const result = await request.execute("VMaster.SHOW_EMPLOYEE_WORKING_STATUS_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_EMPLOYEE_WORKING_STATUS_MASTER SP error:", error);
    throw error;
  }
};

export const getEmployeeWorkingStatusMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("EMP_CURRENT_STATUS_ID", sql.Int, id)
      .execute("VMaster.GET_EMPLOYEE_WORKING_STATUS_MASTER");
    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_EMPLOYEE_WORKING_STATUS_MASTER SP error:", error);
    throw error;
  }
};

export const saveEmployeeWorkingStatusMasterService = async (data: EmployeeWorkingStatusMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("EMP_CURRENT_STATUS_ID", sql.Int, data.EMP_CURRENT_STATUS_ID ?? 0)
      .input("EMP_CURRENT_STATUS_NAME", sql.VarChar(200), data.EMP_CURRENT_STATUS_NAME || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(50), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_EMPLOYEE_WORKING_STATUS_MASTER");
    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to save working status");

    return { message: message || "Working status saved successfully" };
  } catch (error) {
    console.error("SAVE_EMPLOYEE_WORKING_STATUS_MASTER SP error:", error);
    throw error;
  }
};

export const updateEmployeeWorkingStatusMasterService = async (data: EmployeeWorkingStatusMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("EMP_CURRENT_STATUS_ID", sql.Int, data.EMP_CURRENT_STATUS_ID ?? 0)
      .input("EMP_CURRENT_STATUS_NAME", sql.VarChar(200), data.EMP_CURRENT_STATUS_NAME ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(50), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_EMPLOYEE_WORKING_STATUS_MASTER");
    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update working status");

    return { message: message || "Working status updated successfully" };
  } catch (error) {
    console.error("UPDATE_EMPLOYEE_WORKING_STATUS_MASTER SP error:", error);
    throw error;
  }
};

export const deleteEmployeeWorkingStatusMasterService = async (
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
      .input("EMP_CURRENT_STATUS_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_EMPLOYEE_WORKING_STATUS_MASTER");
    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete");

    return { message: message || "Working status deleted successfully" };
  } catch (error) {
    console.error("DELETE_EMPLOYEE_WORKING_STATUS_MASTER SP error:", error);
    throw error;
  }
};
