import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface GunCategoryMasterData {
  GUN_CATEGORY_ID?: number;
  GUN_CATEGORY_NAME: string;
  DESCRIPTION: string;
  REMARKS: string;
  STATUS_MASTER: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllGunCategoryMasterService = async (status?: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool.request().execute("VMaster.SHOW_GUN_CATEGORY_MASTER");
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
    console.error("SHOW_GUN_CATEGORY_MASTER SP error:", error);
    throw error;
  }
};

export const getGunCategoryMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("GUN_CATEGORY_ID", sql.Int, id)
      .execute("VMaster.GET_GUN_CATEGORY_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_GUN_CATEGORY_MASTER SP error:", error);
    throw error;
  }
};

export const saveGunCategoryMasterService = async (data: GunCategoryMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("GUN_CATEGORY_ID", sql.Int, data.GUN_CATEGORY_ID ?? 0)
      .input("GUN_CATEGORY_NAME", sql.VarChar(200), data.GUN_CATEGORY_NAME || null)
      .input("DESCRIPTION", sql.VarChar(500), data.DESCRIPTION || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(50), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_GUN_CATEGORY_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to save gun category");

    return { message: message || "Gun category saved successfully" };
  } catch (error) {
    console.error("SAVE_GUN_CATEGORY_MASTER SP error:", error);
    throw error;
  }
};

export const updateGunCategoryMasterService = async (data: GunCategoryMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("GUN_CATEGORY_ID", sql.Int, data.GUN_CATEGORY_ID ?? 0)
      .input("GUN_CATEGORY_NAME", sql.VarChar(200), data.GUN_CATEGORY_NAME ?? null)
      .input("DESCRIPTION", sql.VarChar(500), data.DESCRIPTION ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(50), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_GUN_CATEGORY_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update gun category");

    return { message: message || "Gun category updated successfully" };
  } catch (error) {
    console.error("UPDATE_GUN_CATEGORY_MASTER SP error:", error);
    throw error;
  }
};

export const deleteGunCategoryMasterService = async (
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
      .input("GUN_CATEGORY_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_GUN_CATEGORY_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete");

    return { message: message || "Gun category deleted successfully" };
  } catch (error) {
    console.error("DELETE_GUN_CATEGORY_MASTER SP error:", error);
    throw error;
  }
};
