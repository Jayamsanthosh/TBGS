import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface UserData {
  LOGIN_ID?: number;
  EMP_ID?: number;
  LOGIN_NAME: string;
  PASSWORD?: string;
  ROLE?: string;
  MOBILE_NO?: string;
  MAIL_ID?: string;
  STOCK_SHOW_STATUS?: string;
  OUTSIDE_ACCESS_Y_N?: string;
  STATUS_MASTER?: string;
  REMARKS?: string;
  USER?: string;
  MAC_ADDRESS?: string;
}

export const getAllUsersService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool.request().execute("VMaster.SHOW_USER_INFO_HDR");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_USER_INFO_HDR SP error:", error);
    throw error;
  }
};

export const showUserByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("LOGIN_ID", sql.Int, id)
      .execute("VMaster.GET_USER_INFO_HDR");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_USER_INFO_HDR SP error:", error);
    throw error;
  }
};


export const updateUserInfoService = async (user: UserData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const empId = user.EMP_ID && String(user.EMP_ID).trim() !== "" ? Number(user.EMP_ID) : null;
    const result = await pool
      .request()
      .input("LOGIN_ID", sql.Int, user.LOGIN_ID)
      .input("EMP_ID", sql.Int, empId)
      .input("LOGIN_NAME", sql.VarChar(50), user.LOGIN_NAME || null)
      .input("PASSWORD", sql.VarChar(100), user.PASSWORD || null)
      .input("ROLE", sql.VarChar(100), user.ROLE ?? null)
      .input("MOBILE_NO", sql.VarChar(30), user.MOBILE_NO ?? null)
      .input("MAIL_ID", sql.VarChar(150), user.MAIL_ID ?? null)
      .input("STOCK_SHOW_STATUS", sql.VarChar(10), user.STOCK_SHOW_STATUS ?? null)
      .input("OUTSIDE_ACCESS_Y_N", sql.VarChar(20), user.OUTSIDE_ACCESS_Y_N ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), user.STATUS_MASTER ?? null)
      .input("REMARKS", sql.VarChar(1000), user.REMARKS ?? null)
      .input("USER", sql.VarChar(50), user.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), user.MAC_ADDRESS ?? null)
      .execute("VMaster.UPDATE_USER_INFO_HDR");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update user");

    return { message: message || "User updated successfully" };
  } catch (error) {
    console.error("UPDATE_USER_INFO_HDR SP error:", error);
    throw error;
  }
};

export const saveUserInfoService = async (user: UserData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const loginId = user.LOGIN_ID ? Number(user.LOGIN_ID) : 0;
    const empId = user.EMP_ID && String(user.EMP_ID).trim() !== "" ? Number(user.EMP_ID) : null;

    const result = await pool
      .request()
      .input("LOGIN_ID", sql.Int, loginId)
      .input("EMP_ID", sql.Int, empId)
      .input("LOGIN_NAME", sql.VarChar(50), user.LOGIN_NAME || null)
      .input("PASSWORD", sql.VarChar(100), user.PASSWORD || null)
      .input("ROLE", sql.VarChar(100), user.ROLE ?? null)
      .input("MOBILE_NO", sql.VarChar(30), user.MOBILE_NO ?? null)
      .input("MAIL_ID", sql.VarChar(150), user.MAIL_ID ?? null)
      .input("STOCK_SHOW_STATUS", sql.VarChar(10), user.STOCK_SHOW_STATUS ?? null)
      .input("OUTSIDE_ACCESS_Y_N", sql.VarChar(20), user.OUTSIDE_ACCESS_Y_N ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), user.STATUS_MASTER ?? null)
      .input("REMARKS", sql.VarChar(1000), user.REMARKS ?? null)
      .input("USER", sql.VarChar(50), user.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), user.MAC_ADDRESS ?? null)
      .execute("VMaster.SAVE_USER_INFO_HDR");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save user");

    return { message: message || "User saved successfully", LOGIN_ID: savedData };
  } catch (error) {
    console.error("SAVE_USER_INFO_HDR SP error:", error);
    throw error;
  }
};

export const deleteUserService = async (
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
      .input("LOGIN_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user)
      .input("ROLE", sql.VarChar(100), role)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VMaster.DELETE_USER_INFO_HDR");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete user");

    return { message: message || "User deleted successfully" };
  } catch (error) {
    console.error("DELETE_USER_INFO_HDR SP error:", error);
    throw error;
  }
};