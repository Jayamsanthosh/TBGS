import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface DepartmentGroupMasterData {
  DEPARTMENT_GROUP_ID?: number;
  DEPARTMENT_GROUP_NAME: string;
  MANAGER_EMP_ID: number;
  TO_MAIL_ADDRESS: string;
  CC_MAIL_ADDRESS: string;
  BCC_MAIL_ADDRESS: string;
  REMARKS: string;
  STATUS_MASTER: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllDepartmentGroupMasterService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .execute("VMaster.SHOW_DEPARTMENT_GROUP_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_DEPARTMENT_GROUP_MASTER SP error:", error);
    throw error;
  }
};

export const getDepartmentGroupMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("DEPARTMENT_GROUP_ID", sql.Int, id)
      .execute("VMaster.GET_DEPARTMENT_GROUP_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_DEPARTMENT_GROUP_MASTER SP error:", error);
    throw error;
  }
};

export const saveDepartmentGroupMasterService = async (data: DepartmentGroupMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("DEPARTMENT_GROUP_ID", sql.Int, data.DEPARTMENT_GROUP_ID ?? 0)
      .input("DEPARTMENT_GROUP_NAME", sql.VarChar(200), data.DEPARTMENT_GROUP_NAME || null)
      .input("MANAGER_EMP_ID", sql.Int, data.MANAGER_EMP_ID ?? null)
      .input("TO_MAIL_ADDRESS", sql.VarChar(500), data.TO_MAIL_ADDRESS || null)
      .input("CC_MAIL_ADDRESS", sql.VarChar(500), data.CC_MAIL_ADDRESS || null)
      .input("BCC_MAIL_ADDRESS", sql.VarChar(500), data.BCC_MAIL_ADDRESS || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(50), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_DEPARTMENT_GROUP_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to save department group");

    return { message: message || "Department group saved successfully" };
  } catch (error) {
    console.error("SAVE_DEPARTMENT_GROUP_MASTER SP error:", error);
    throw error;
  }
};

export const updateDepartmentGroupMasterService = async (data: DepartmentGroupMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("DEPARTMENT_GROUP_ID", sql.Int, data.DEPARTMENT_GROUP_ID ?? 0)
      .input("DEPARTMENT_GROUP_NAME", sql.VarChar(200), data.DEPARTMENT_GROUP_NAME ?? null)
      .input("MANAGER_EMP_ID", sql.Int, data.MANAGER_EMP_ID ?? null)
      .input("TO_MAIL_ADDRESS", sql.VarChar(500), data.TO_MAIL_ADDRESS ?? null)
      .input("CC_MAIL_ADDRESS", sql.VarChar(500), data.CC_MAIL_ADDRESS ?? null)
      .input("BCC_MAIL_ADDRESS", sql.VarChar(500), data.BCC_MAIL_ADDRESS ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(50), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_DEPARTMENT_GROUP_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update department group");

    return { message: message || "Department group updated successfully" };
  } catch (error) {
    console.error("UPDATE_DEPARTMENT_GROUP_MASTER SP error:", error);
    throw error;
  }
};

export const deleteDepartmentGroupMasterService = async (
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
      .input("DEPARTMENT_GROUP_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_DEPARTMENT_GROUP_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete");

    return { message: message || "Department group deleted successfully" };
  } catch (error) {
    console.error("DELETE_DEPARTMENT_GROUP_MASTER SP error:", error);
    throw error;
  }
};
