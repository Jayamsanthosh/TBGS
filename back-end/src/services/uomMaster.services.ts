import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface UomMasterData {
  UOM_ID?: number;
  UOM_NAME: string;
  KG_PER_UOM: number;
  REMARKS: string;
  STATUS_MASTER: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllUomMasterService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .execute("VMaster.SHOW_UOM_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_UOM_MASTER SP error:", error);
    throw error;
  }
};

export const getUomMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("UOM_ID", sql.Int, id)
      .execute("VMaster.GET_UOM_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_UOM_MASTER SP error:", error);
    throw error;
  }
};

export const saveUomMasterService = async (data: UomMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("UOM_ID", sql.Int, data.UOM_ID ?? 0)
      .input("UOM_NAME", sql.VarChar(50), data.UOM_NAME || null)
      .input("KG_PER_UOM", sql.Decimal(15, 2), data.KG_PER_UOM ?? 0)
      .input("REMARKS", sql.VarChar(2000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_UOM_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to save UOM");

    return { message: message || "UOM saved successfully" };
  } catch (error) {
    console.error("SAVE_UOM_MASTER SP error:", error);
    throw error;
  }
};

export const updateUomMasterService = async (data: UomMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("UOM_ID", sql.Int, data.UOM_ID ?? 0)
      .input("UOM_NAME", sql.VarChar(50), data.UOM_NAME ?? null)
      .input("KG_PER_UOM", sql.Decimal(15, 2), data.KG_PER_UOM ?? 0)
      .input("REMARKS", sql.VarChar(2000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_UOM_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update UOM");

    return { message: message || "UOM updated successfully" };
  } catch (error) {
    console.error("UPDATE_UOM_MASTER SP error:", error);
    throw error;
  }
};

export const deleteUomMasterService = async (
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
      .input("UOM_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_UOM_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete UOM");

    return { message: message || "UOM deleted successfully" };
  } catch (error) {
    console.error("DELETE_UOM_MASTER SP error:", error);
    throw error;
  }
};
