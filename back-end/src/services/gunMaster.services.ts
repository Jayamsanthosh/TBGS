import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface GunMasterData {
  GUN_ID?: number;
  GUN_CODE?: string;
  GUN_NAME?: string;
  GUN_CATEGORY_ID?: number;
  GUN_TYPE_ID?: number;
  GUN_BRAND_ID?: number;
  CALIBER_ID?: number;
  CAMP_ID?: number;
  STORE_ID?: number;
  MODEL?: string;
  SERIAL_NUMBER?: string;
  BARREL_LENGTH?: number;
  MAGAZINE_CAPACITY?: number;
  LICENSE_NUMBER?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export interface GunMasterFilter {
  gunCategoryId?: string;
  gunTypeId?: string;
  gunBrandId?: string;
  caliberId?: string;
  campId?: string;
  storeId?: string;
  status?: string;
}

const serializeRecordset = (rows: any[]) =>
  (rows || []).map((r: any) => ({ ...r, id: r.GUN_ID }));

export const getAllGunMasterService = async (filters: GunMasterFilter) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const req = pool.request();
    addFilterParam(req, "GUN_CATEGORY_ID", filters.gunCategoryId);
    addFilterParam(req, "GUN_TYPE_ID", filters.gunTypeId);
    addFilterParam(req, "GUN_BRAND_ID", filters.gunBrandId);
    addFilterParam(req, "CALIBER_ID", filters.caliberId);
    addFilterParam(req, "CAMP_ID", filters.campId);
    addFilterParam(req, "STORE_ID", filters.storeId);
    addFilterParam(req, "STATUS", filters.status);
    const result = await req.execute("VMaster.SHOW_GUN_MASTER");
    return serializeRecordset(result.recordset || []);
  } catch (error) {
    console.error("SHOW_GUN_MASTER SP error:", error);
    throw error;
  }
};

const addFilterParam = (req: any, name: string, value: string | undefined) => {
  req.input(name, sql.VarChar(50), value || "0");
};

export const getGunMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("GUN_ID", sql.Int, id)
      .execute("VMaster.GET_GUN_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_GUN_MASTER SP error:", error);
    throw error;
  }
};

export const saveGunMasterService = async (data: GunMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("GUN_ID", sql.Int, 0)
      .input("GUN_CODE", sql.VarChar(30), data.GUN_CODE || null)
      .input("GUN_NAME", sql.VarChar(100), data.GUN_NAME || null)
      .input("GUN_CATEGORY_ID", sql.Int, data.GUN_CATEGORY_ID ?? null)
      .input("GUN_TYPE_ID", sql.Int, data.GUN_TYPE_ID ?? null)
      .input("GUN_BRAND_ID", sql.Int, data.GUN_BRAND_ID ?? null)
      .input("CALIBER_ID", sql.Int, data.CALIBER_ID ?? null)
      .input("CAMP_ID", sql.Int, data.CAMP_ID ?? null)
      .input("STORE_ID", sql.Int, data.STORE_ID ?? null)
      .input("MODEL", sql.VarChar(100), data.MODEL || null)
      .input("SERIAL_NUMBER", sql.VarChar(100), data.SERIAL_NUMBER || null)
      .input("BARREL_LENGTH", sql.Decimal(10, 2), data.BARREL_LENGTH ?? null)
      .input("MAGAZINE_CAPACITY", sql.Int, data.MAGAZINE_CAPACITY ?? null)
      .input("LICENSE_NUMBER", sql.VarChar(100), data.LICENSE_NUMBER || null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_GUN_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save gun master");

    return { message: message || "Data saved successfully", GUN_ID: savedData };
  } catch (error) {
    console.error("SAVE_GUN_MASTER SP error:", error);
    throw error;
  }
};

export const updateGunMasterService = async (data: GunMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("GUN_ID", sql.Int, data.GUN_ID ?? 0)
      .input("GUN_CODE", sql.VarChar(30), data.GUN_CODE ?? null)
      .input("GUN_NAME", sql.VarChar(100), data.GUN_NAME ?? null)
      .input("GUN_CATEGORY_ID", sql.Int, data.GUN_CATEGORY_ID ?? null)
      .input("GUN_TYPE_ID", sql.Int, data.GUN_TYPE_ID ?? null)
      .input("GUN_BRAND_ID", sql.Int, data.GUN_BRAND_ID ?? null)
      .input("CALIBER_ID", sql.Int, data.CALIBER_ID ?? null)
      .input("CAMP_ID", sql.Int, data.CAMP_ID ?? null)
      .input("STORE_ID", sql.Int, data.STORE_ID ?? null)
      .input("MODEL", sql.VarChar(100), data.MODEL ?? null)
      .input("SERIAL_NUMBER", sql.VarChar(100), data.SERIAL_NUMBER ?? null)
      .input("BARREL_LENGTH", sql.Decimal(10, 2), data.BARREL_LENGTH ?? null)
      .input("MAGAZINE_CAPACITY", sql.Int, data.MAGAZINE_CAPACITY ?? null)
      .input("LICENSE_NUMBER", sql.VarChar(100), data.LICENSE_NUMBER ?? null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_GUN_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update gun master");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_GUN_MASTER SP error:", error);
    throw error;
  }
};

export const deleteGunMasterService = async (
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
      .input("GUN_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_GUN_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete gun master");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    const msg = (error as any)?.message || "";
    if (msg.includes("REFERENCE constraint") || msg.includes("FK_")) {
      throw new Error("Cannot delete: This Gun has associated records. Remove or reassign them first.");
    }
    throw error;
  }
};