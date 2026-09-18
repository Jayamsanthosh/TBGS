import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface CostCentreData {
  COST_CENTRE_ID?: number;
  COST_CENTRE_NAME: string;
  COMPANY_ID?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllCostCentreMasterService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .execute("VMaster.SHOW_COST_CENTRE_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_COST_CENTRE_MASTER SP error:", error);
    throw error;
  }
};

export const getCostCentreMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("COST_CENTRE_ID", sql.Int, id)
      .execute("VMaster.GET_COST_CENTRE_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_COST_CENTRE_MASTER SP error:", error);
    throw error;
  }
};

export const saveCostCentreMasterService = async (data: CostCentreData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("COST_CENTRE_ID", sql.Int, data.COST_CENTRE_ID ?? 0)
      .input("COST_CENTRE_NAME", sql.VarChar(50), data.COST_CENTRE_NAME || null)
      .input("COMPANY_ID", sql.Int, data.COMPANY_ID ?? null)
      .input("REMARKS", sql.VarChar(2000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_COST_CENTRE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to save cost centre");

    return { message: message || "Cost centre saved successfully" };
  } catch (error) {
    console.error("SAVE_COST_CENTRE_MASTER SP error:", error);
    throw error;
  }
};

export const updateCostCentreMasterService = async (data: CostCentreData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("COST_CENTRE_ID", sql.Int, data.COST_CENTRE_ID ?? 0)
      .input("COST_CENTRE_NAME", sql.VarChar(50), data.COST_CENTRE_NAME ?? null)
      .input("COMPANY_ID", sql.Int, data.COMPANY_ID ?? null)
      .input("REMARKS", sql.VarChar(2000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_COST_CENTRE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update cost centre");

    return { message: message || "Cost centre updated successfully" };
  } catch (error) {
    console.error("UPDATE_COST_CENTRE_MASTER SP error:", error);
    throw error;
  }
};

export const deleteCostCentreMasterService = async (
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
      .input("COST_CENTRE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_COST_CENTRE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete cost centre");

    return { message: message || "Cost centre deleted successfully" };
  } catch (error) {
    console.error("DELETE_COST_CENTRE_MASTER SP error:", error);
    throw error;
  }
};
