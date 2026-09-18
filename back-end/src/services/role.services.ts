import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface RoleData {
  ROLE_ID?: number;
  ROLE_NAME: string;
  ROLE_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  ROLE?: string;
  MAC_ADDRESS?: string;
}

export const getAllRolesService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool.request().execute("VMaster.SHOW_ROLE_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_ROLE_MASTER SP error:", error);
    throw error;
  }
};

export const getRoleByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("ROLE_ID", sql.Int, id)
      .execute("VMaster.GET_ROLE_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_ROLE_MASTER SP error:", error);
    throw error;
  }
};

export const saveRoleService = async (role: RoleData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("ROLE_NAME", sql.VarChar(50), role.ROLE_NAME || null)
      .input("ROLE_DESCRIPTION", sql.VarChar(50), role.ROLE_DESCRIPTION ?? null)
      .input("REMARKS", sql.VarChar(1000), role.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), role.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), role.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), role.MAC_ADDRESS ?? null)
      .execute("VMaster.SAVE_ROLE_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save role");

    return { message: message || "Role saved successfully", ROLE_ID: savedData };
  } catch (error) {
    console.error("SAVE_ROLE_MASTER SP error:", error);
    throw error;
  }
};

export const updateRoleService = async (role: RoleData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("ROLE_ID", sql.Int, role.ROLE_ID)
      .input("ROLE_NAME", sql.VarChar(50), role.ROLE_NAME || null)
      .input("ROLE_DESCRIPTION", sql.VarChar(50), role.ROLE_DESCRIPTION ?? null)
      .input("REMARKS", sql.VarChar(1000), role.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), role.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), role.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), role.MAC_ADDRESS ?? null)
      .execute("VMaster.UPDATE_ROLE_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to update role");

    return { message: message || "Role updated successfully", ROLE_ID: savedData };
  } catch (error) {
    console.error("UPDATE_ROLE_MASTER SP error:", error);
    throw error;
  }
};

export const deleteRoleService = async (
  id: number,
  user: string = "Admin",
  role: string = "Admin",
  macAddress: string | null = null
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("ROLE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user)
      .input("ROLE", sql.VarChar(50), role)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VMaster.DELETE_ROLE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete role");

    return { message: message || "Role deleted successfully" };
  } catch (error) {
    console.error("DELETE_ROLE_MASTER SP error:", error);
    throw error;
  }
};