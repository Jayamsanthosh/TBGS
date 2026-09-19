import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface UserStoreMappingData {
  USER_TO_STORE_ID?: number;
  LOGIN_ID?: number;
  COMPANY_ID?: number;
  CAMP_ID?: number;
  STORE_ID?: number;
  ROLE_ID?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllUserStoreMappingService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .execute("VMaster.SHOW_USER_TO_STORE_MAPPING");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_USER_TO_STORE_MAPPING SP error:", error);
    throw error;
  }
};

export const getUserStoreMappingByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("USER_TO_STORE_ID", sql.Int, id)
      .execute("VMaster.GET_USER_TO_STORE_MAPPING");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_USER_TO_STORE_MAPPING SP error:", error);
    throw error;
  }
};

export const saveUserStoreMappingService = async (data: UserStoreMappingData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("USER_TO_STORE_ID", sql.Int, data.USER_TO_STORE_ID ?? 0)
      .input("LOGIN_ID", sql.Int, data.LOGIN_ID ?? null)
      .input("COMPANY_ID", sql.Int, data.COMPANY_ID ?? null)
      .input("CAMP_ID", sql.Int, data.CAMP_ID ?? null)
      .input("STORE_ID", sql.Int, data.STORE_ID ?? null)
      .input("ROLE_ID", sql.Int, data.ROLE_ID ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_USER_TO_STORE_MAPPING");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to save mapping");

    return { message: message || "Mapping saved successfully" };
  } catch (error) {
    console.error("SAVE_USER_TO_STORE_MAPPING SP error:", error);
    throw error;
  }
};

export const updateUserStoreMappingService = async (data: UserStoreMappingData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("USER_TO_STORE_ID", sql.Int, data.USER_TO_STORE_ID ?? 0)
      .input("LOGIN_ID", sql.Int, data.LOGIN_ID ?? null)
      .input("COMPANY_ID", sql.Int, data.COMPANY_ID ?? null)
      .input("CAMP_ID", sql.Int, data.CAMP_ID ?? null)
      .input("STORE_ID", sql.Int, data.STORE_ID ?? null)
      .input("ROLE_ID", sql.Int, data.ROLE_ID ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_USER_TO_STORE_MAPPING");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update mapping");

    return { message: message || "Mapping updated successfully" };
  } catch (error) {
    console.error("UPDATE_USER_TO_STORE_MAPPING SP error:", error);
    throw error;
  }
};

export const deleteUserStoreMappingService = async (
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
      .input("USER_TO_STORE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_USER_TO_STORE_MAPPING");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete mapping");

    return { message: message || "Mapping deleted successfully" };
  } catch (error) {
    console.error("DELETE_USER_TO_STORE_MAPPING SP error:", error);
    throw error;
  }
};
