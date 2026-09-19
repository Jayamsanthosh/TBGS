import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface PermitAuthorityMasterData {
  PERMIT_AUTHORITY_ID?: number;
  PERMIT_AUTHORITY_NAME: string;
  COUNTRY_ID?: number;
  CONTACT_PERSON?: string;
  CONTACT_NUMBER?: string;
  EMAIL?: string;
  WEBSITE?: string;
  ADDRESS?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllPermitAuthorityMasterService = async (status: string = "ALL") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(10), status || "ALL")
      .execute("VMaster.SHOW_PERMIT_AUTHORITY_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_PERMIT_AUTHORITY_MASTER SP error:", error);
    throw error;
  }
};

export const getPermitAuthorityMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PERMIT_AUTHORITY_ID", sql.Int, id)
      .execute("VMaster.GET_PERMIT_AUTHORITY_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_PERMIT_AUTHORITY_MASTER SP error:", error);
    throw error;
  }
};

export const savePermitAuthorityMasterService = async (data: PermitAuthorityMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PERMIT_AUTHORITY_ID", sql.Int, data.PERMIT_AUTHORITY_ID ?? 0)
      .input("PERMIT_AUTHORITY_NAME", sql.VarChar(150), data.PERMIT_AUTHORITY_NAME || null)
      .input("COUNTRY_ID", sql.Int, data.COUNTRY_ID ?? null)
      .input("CONTACT_PERSON", sql.VarChar(100), data.CONTACT_PERSON || null)
      .input("CONTACT_NUMBER", sql.VarChar(50), data.CONTACT_NUMBER || null)
      .input("EMAIL", sql.VarChar(100), data.EMAIL || null)
      .input("WEBSITE", sql.VarChar(200), data.WEBSITE || null)
      .input("ADDRESS", sql.VarChar(500), data.ADDRESS || null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_PERMIT_AUTHORITY_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to save permit authority");

    return { message: message || "Permit authority saved successfully" };
  } catch (error) {
    console.error("SAVE_PERMIT_AUTHORITY_MASTER SP error:", error);
    throw error;
  }
};

export const updatePermitAuthorityMasterService = async (data: PermitAuthorityMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PERMIT_AUTHORITY_ID", sql.Int, data.PERMIT_AUTHORITY_ID ?? 0)
      .input("PERMIT_AUTHORITY_NAME", sql.VarChar(150), data.PERMIT_AUTHORITY_NAME ?? null)
      .input("COUNTRY_ID", sql.Int, data.COUNTRY_ID ?? null)
      .input("CONTACT_PERSON", sql.VarChar(100), data.CONTACT_PERSON ?? null)
      .input("CONTACT_NUMBER", sql.VarChar(50), data.CONTACT_NUMBER ?? null)
      .input("EMAIL", sql.VarChar(100), data.EMAIL ?? null)
      .input("WEBSITE", sql.VarChar(200), data.WEBSITE ?? null)
      .input("ADDRESS", sql.VarChar(500), data.ADDRESS ?? null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_PERMIT_AUTHORITY_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update permit authority");

    return { message: message || "Permit authority updated successfully" };
  } catch (error) {
    console.error("UPDATE_PERMIT_AUTHORITY_MASTER SP error:", error);
    throw error;
  }
};

export const deletePermitAuthorityMasterService = async (
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
      .input("PERMIT_AUTHORITY_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_PERMIT_AUTHORITY_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete");

    return { message: message || "Permit authority deleted successfully" };
  } catch (error) {
    console.error("DELETE_PERMIT_AUTHORITY_MASTER SP error:", error);
    throw error;
  }
};