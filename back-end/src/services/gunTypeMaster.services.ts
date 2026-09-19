import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface GunTypeMasterData {
  GUN_TYPE_ID?: number;
  TYPE_NAME: string;
  DESCRIPTION: string;
  REMARKS: string;
  STATUS_MASTER: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllGunTypeMasterService = async (status?: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool.request().execute("VMaster.SHOW_GUN_TYPE_MASTER");
    const rows = result.recordset || [];

    if (status) {
      const s = status.toUpperCase();
      return rows.filter((r: any) => {
        const sp = String(r.STATUS_MASTER || "").toUpperCase();
        if (s === "AC") return sp === "ACTIVE" || sp === "AC";
        if (s === "IN" || s === "IA") return sp === "INACTIVE" || sp === "IN" || sp === "IA";
        return sp === s;
      });
    }

    return rows;
  } catch (error) {
    console.error("SHOW_GUN_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const getGunTypeMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("GUN_TYPE_ID", sql.Int, id)
      .execute("VMaster.GET_GUN_TYPE_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_GUN_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const saveGunTypeMasterService = async (data: GunTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("GUN_TYPE_ID", sql.Int, data.GUN_TYPE_ID ?? 0)
      .input("TYPE_NAME", sql.VarChar(200), data.TYPE_NAME || null)
      .input("DESCRIPTION", sql.VarChar(500), data.DESCRIPTION || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(50), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_GUN_TYPE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to save gun type");

    return { message: message || "Gun type saved successfully" };
  } catch (error) {
    console.error("SAVE_GUN_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const updateGunTypeMasterService = async (data: GunTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("GUN_TYPE_ID", sql.Int, data.GUN_TYPE_ID ?? 0)
      .input("TYPE_NAME", sql.VarChar(200), data.TYPE_NAME ?? null)
      .input("DESCRIPTION", sql.VarChar(500), data.DESCRIPTION ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(50), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_GUN_TYPE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update gun type");

    return { message: message || "Gun type updated successfully" };
  } catch (error) {
    console.error("UPDATE_GUN_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const deleteGunTypeMasterService = async (
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
      .input("GUN_TYPE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_GUN_TYPE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete");

    return { message: message || "Gun type deleted successfully" };
  } catch (error) {
    console.error("DELETE_GUN_TYPE_MASTER SP error:", error);
    throw error;
  }
};
