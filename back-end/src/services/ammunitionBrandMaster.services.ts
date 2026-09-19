import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface AmmunitionBrandMasterData {
  AMMUNITION_BRAND_ID?: number;
  BRAND_NAME: string;
  COUNTRY_OF_ORIGIN?: number;
  CONTACT_PERSON?: string;
  CONTACT_NUMBER?: string;
  EMAIL?: string;
  WEBSITE?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllAmmunitionBrandMasterService = async (status = "AC") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("status", sql.VarChar(10), status)
      .execute("VMaster.SHOW_AMMUNITION_BRAND_MASTER");

    const rows = (result.recordset || []).map((r: any) => ({
      ...r,
      COUNTRY_NAME: r["Country Of Origin"] || r.COUNTRY_NAME,
    }));
    return rows;
  } catch (error) {
    console.error("SHOW_AMMUNITION_BRAND_MASTER SP error:", error);
    throw error;
  }
};

export const getAmmunitionBrandMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("AMMUNITION_BRAND_ID", sql.Int, id)
      .execute("VMaster.GET_AMMUNITION_BRAND_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_AMMUNITION_BRAND_MASTER SP error:", error);
    throw error;
  }
};

export const saveAmmunitionBrandMasterService = async (data: AmmunitionBrandMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("AMMUNITION_BRAND_ID", sql.Int, data.AMMUNITION_BRAND_ID ?? 0)
      .input("BRAND_NAME", sql.VarChar(100), data.BRAND_NAME || null)
      .input("COUNTRY_OF_ORIGIN", sql.Int, data.COUNTRY_OF_ORIGIN ?? null)
      .input("CONTACT_PERSON", sql.VarChar(100), data.CONTACT_PERSON || null)
      .input("CONTACT_NUMBER", sql.VarChar(30), data.CONTACT_NUMBER || null)
      .input("EMAIL", sql.VarChar(100), data.EMAIL || null)
      .input("WEBSITE", sql.VarChar(200), data.WEBSITE || null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_AMMUNITION_BRAND_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save ammunition brand");

    return { message: message || "Data saved successfully", AMMUNITION_BRAND_ID: savedData };
  } catch (error) {
    console.error("SAVE_AMMUNITION_BRAND_MASTER SP error:", error);
    throw error;
  }
};

export const updateAmmunitionBrandMasterService = async (data: AmmunitionBrandMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("AMMUNITION_BRAND_ID", sql.Int, data.AMMUNITION_BRAND_ID ?? 0)
      .input("BRAND_NAME", sql.VarChar(100), data.BRAND_NAME ?? null)
      .input("COUNTRY_OF_ORIGIN", sql.Int, data.COUNTRY_OF_ORIGIN ?? null)
      .input("CONTACT_PERSON", sql.VarChar(100), data.CONTACT_PERSON ?? null)
      .input("CONTACT_NUMBER", sql.VarChar(30), data.CONTACT_NUMBER ?? null)
      .input("EMAIL", sql.VarChar(100), data.EMAIL ?? null)
      .input("WEBSITE", sql.VarChar(200), data.WEBSITE ?? null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_AMMUNITION_BRAND_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update ammunition brand");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_AMMUNITION_BRAND_MASTER SP error:", error);
    throw error;
  }
};

export const deleteAmmunitionBrandMasterService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("AMMUNITION_BRAND_ID", sql.Int, id)
      .execute("VMaster.DELETE_AMMUNITION_BRAND_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete ammunition brand");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_AMMUNITION_BRAND_MASTER SP error:", error);
    throw error;
  }
};