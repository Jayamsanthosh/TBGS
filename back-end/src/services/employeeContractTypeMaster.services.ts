import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface EmployeeContractTypeMasterData {
  CONTRACT_TYPE_ID?: number;
  CONTRACT_TYPE_NAME: string;
  REMARKS?: string;
  STATUS_MASTER: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllEmployeeContractTypeMasterService = async (status?: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const request = pool.request();
    if (status) {
      request.input("status", sql.VarChar(2), status);
    }
    const result = await request.execute("VMaster.SHOW_EMPLOYEE_CONTRACT_TYPE_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_EMPLOYEE_CONTRACT_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const getEmployeeContractTypeMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("CONTRACT_TYPE_ID", sql.Int, id)
      .execute("VMaster.GET_EMPLOYEE_CONTRACT_TYPE_MASTER");
    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_EMPLOYEE_CONTRACT_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const saveEmployeeContractTypeMasterService = async (data: EmployeeContractTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("CONTRACT_TYPE_NAME", sql.VarChar(200), data.CONTRACT_TYPE_NAME || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(50), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_EMPLOYEE_CONTRACT_TYPE_MASTER");
    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to save contract type");

    return { message: message || "Contract type saved successfully" };
  } catch (error) {
    console.error("SAVE_EMPLOYEE_CONTRACT_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const updateEmployeeContractTypeMasterService = async (data: EmployeeContractTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("CONTRACT_TYPE_ID", sql.Int, data.CONTRACT_TYPE_ID ?? 0)
      .input("CONTRACT_TYPE_NAME", sql.VarChar(200), data.CONTRACT_TYPE_NAME ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(50), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_EMPLOYEE_CONTRACT_TYPE_MASTER");
    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update contract type");

    return { message: message || "Contract type updated successfully" };
  } catch (error) {
    console.error("UPDATE_EMPLOYEE_CONTRACT_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const deleteEmployeeContractTypeMasterService = async (
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
      .input("CONTRACT_TYPE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_EMPLOYEE_CONTRACT_TYPE_MASTER");
    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete");

    return { message: message || "Contract type deleted successfully" };
  } catch (error) {
    console.error("DELETE_EMPLOYEE_CONTRACT_TYPE_MASTER SP error:", error);
    throw error;
  }
};
