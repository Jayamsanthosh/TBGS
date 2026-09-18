import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface LicensePermitTypeData {
  LICENSE_PERMIT_ID?: number;
  LICENSE_PERMIT_NAME: string;
  REMARKS: string;
  STATUS_MASTER: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllLicensePermitTypeService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .execute("VMaster.SHOW_LICENSE_PERMIT_TYPE_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_LICENSE_PERMIT_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const getLicensePermitTypeByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("LICENSE_PERMIT_ID", sql.Int, id)
      .execute("VMaster.GET_LICENSE_PERMIT_TYPE_MASTER");
    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_LICENSE_PERMIT_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const saveLicensePermitTypeService = async (data: LicensePermitTypeData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("LICENSE_PERMIT_ID", sql.Int, data.LICENSE_PERMIT_ID ?? 0)
      .input("LICENSE_PERMIT_NAME", sql.VarChar(50), data.LICENSE_PERMIT_NAME || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_LICENSE_PERMIT_TYPE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to save license permit type");

    return { message: message || "License permit type saved successfully" };
  } catch (error) {
    console.error("SAVE_LICENSE_PERMIT_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const updateLicensePermitTypeService = async (data: LicensePermitTypeData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("LICENSE_PERMIT_ID", sql.Int, data.LICENSE_PERMIT_ID ?? 0)
      .input("LICENSE_PERMIT_NAME", sql.VarChar(50), data.LICENSE_PERMIT_NAME ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_LICENSE_PERMIT_TYPE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update license permit type");

    return { message: message || "License permit type updated successfully" };
  } catch (error) {
    console.error("UPDATE_LICENSE_PERMIT_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const deleteLicensePermitTypeService = async (
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
      .input("LICENSE_PERMIT_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_LICENSE_PERMIT_TYPE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete");

    return { message: message || "License permit type deleted successfully" };
  } catch (error) {
    console.error("DELETE_LICENSE_PERMIT_TYPE_MASTER SP error:", error);
    throw error;
  }
};
