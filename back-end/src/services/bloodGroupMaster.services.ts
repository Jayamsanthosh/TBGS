import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface BloodGroupMasterData {
  BLOOD_GROUP_ID?: number;
  BLOOD_GROUP_NAME?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const toInt = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

export const getAllBloodGroupMasterService = async (status?: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(20), status || "Active")
      .execute("VMaster.SHOW_BLOOD_GROUP_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_BLOOD_GROUP_MASTER SP error:", error);
    throw error;
  }
};

export const getBloodGroupMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("BLOOD_GROUP_ID", sql.Int, id)
      .execute("VMaster.GET_BLOOD_GROUP_MASTER");
    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_BLOOD_GROUP_MASTER SP error:", error);
    throw error;
  }
};

export const saveBloodGroupMasterService = async (data: BloodGroupMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("BLOOD_GROUP_ID", sql.Int, toInt(data.BLOOD_GROUP_ID))
      .input("BLOOD_GROUP_NAME", sql.VarChar(50), data.BLOOD_GROUP_NAME || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_BLOOD_GROUP_MASTER");
    const { message, data: id } = parseSprocResult(result.recordset?.[0], "Failed to save blood group");
    return { message: message || "Blood group saved successfully", BLOOD_GROUP_ID: id || Number(data.BLOOD_GROUP_ID ?? 0) };
  } catch (error) {
    console.error("SAVE_BLOOD_GROUP_MASTER SP error:", error);
    throw error;
  }
};

export const updateBloodGroupMasterService = async (data: BloodGroupMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("BLOOD_GROUP_ID", sql.Int, toInt(data.BLOOD_GROUP_ID))
      .input("BLOOD_GROUP_NAME", sql.VarChar(50), data.BLOOD_GROUP_NAME || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.UPDATE_BLOOD_GROUP_MASTER");
    const { message } = parseSprocResult(result.recordset?.[0], "Failed to update blood group");
    return { message: message || "Blood group updated successfully" };
  } catch (error) {
    console.error("UPDATE_BLOOD_GROUP_MASTER SP error:", error);
    throw error;
  }
};

export const deleteBloodGroupMasterService = async (
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
      .input("BLOOD_GROUP_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_BLOOD_GROUP_MASTER");
    const { message } = parseSprocResult(result.recordset?.[0], "No rights to delete");
    return { message: message || "Blood group deleted successfully" };
  } catch (error) {
    console.error("DELETE_BLOOD_GROUP_MASTER SP error:", error);
    throw error;
  }
};
