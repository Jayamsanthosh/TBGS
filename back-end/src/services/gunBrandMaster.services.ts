import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface GunBrandMasterData {
  GUN_BRAND_ID?: number;
  BRAND_NAME: string;
  BP_ID?: number;
  COUNTRY_OF_ORIGIN?: number;
  WEBSITE?: string;
  CONTACT_PERSON?: string;
  CONTACT_NUMBER?: string;
  EMAIL?: string;
  WARRANTY_AVAILABLE?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllGunBrandMasterService = async (status = "ALL") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    if (status === "ALL") {
      const statuses = ["AC", "IA"];
      let allRows: any[] = [];
      for (const s of statuses) {
        const result = await pool
          .request()
          .input("status", sql.VarChar(50), s)
          .execute("VMaster.SHOW_GUN_BRAND_MASTER");
        allRows = allRows.concat(result.recordset || []);
      }
      return allRows;
    }

    const result = await pool
      .request()
      .input("status", sql.VarChar(50), status)
      .execute("VMaster.SHOW_GUN_BRAND_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_GUN_BRAND_MASTER SP error:", error);
    throw error;
  }
};

export const getGunBrandMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("GUN_BRAND_ID", sql.Int, id)
      .execute("VMaster.GET_GUN_BRAND_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_GUN_BRAND_MASTER SP error:", error);
    throw error;
  }
};

export const saveGunBrandMasterService = async (data: GunBrandMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("GUN_BRAND_ID", sql.Int, data.GUN_BRAND_ID ?? 0)
      .input("BRAND_NAME", sql.VarChar(100), data.BRAND_NAME || null)
      .input("BP_ID", sql.Int, data.BP_ID ?? null)
      .input("COUNTRY_OF_ORIGIN", sql.Int, data.COUNTRY_OF_ORIGIN ?? null)
      .input("WEBSITE", sql.VarChar(200), data.WEBSITE || null)
      .input("CONTACT_PERSON", sql.VarChar(100), data.CONTACT_PERSON || null)
      .input("CONTACT_NUMBER", sql.VarChar(30), data.CONTACT_NUMBER || null)
      .input("EMAIL", sql.VarChar(100), data.EMAIL || null)
      .input("WARRANTY_AVAILABLE", sql.VarChar(20), data.WARRANTY_AVAILABLE || null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_GUN_BRAND_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save gun brand");

    return { message: message || "Data saved successfully", GUN_BRAND_ID: savedData };
  } catch (error) {
    console.error("SAVE_GUN_BRAND_MASTER SP error:", error);
    throw error;
  }
};

export const updateGunBrandMasterService = async (data: GunBrandMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("GUN_BRAND_ID", sql.Int, data.GUN_BRAND_ID ?? 0)
      .input("BRAND_NAME", sql.VarChar(100), data.BRAND_NAME ?? null)
      .input("BP_ID", sql.Int, data.BP_ID ?? null)
      .input("COUNTRY_OF_ORIGIN", sql.Int, data.COUNTRY_OF_ORIGIN ?? null)
      .input("WEBSITE", sql.VarChar(200), data.WEBSITE ?? null)
      .input("CONTACT_PERSON", sql.VarChar(100), data.CONTACT_PERSON ?? null)
      .input("CONTACT_NUMBER", sql.VarChar(30), data.CONTACT_NUMBER ?? null)
      .input("EMAIL", sql.VarChar(100), data.EMAIL ?? null)
      .input("WARRANTY_AVAILABLE", sql.VarChar(20), data.WARRANTY_AVAILABLE ?? null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_GUN_BRAND_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update gun brand");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_GUN_BRAND_MASTER SP error:", error);
    throw error;
  }
};

export const deleteGunBrandMasterService = async (
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
      .input("GUN_BRAND_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_GUN_BRAND_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete gun brand");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_GUN_BRAND_MASTER SP error:", error);
    throw error;
  }
};