import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

const normalizeStatus = (status: string | undefined | null): string => {
  if (!status) return 'AC';
  const s = status.trim().toUpperCase();
  if (s === 'ACTIVE' || s === 'AC') return 'AC';
  if (s === 'INACTIVE' || s === 'IN') return 'IN';
  return s.substring(0, 2);
};

export interface AntiPoachingFindingsMasterData {
  ANTI_POACHING_FINDINGS_ID?: number;
  ANTI_POACHING_FINDINGS_NAME: string;
  ANTI_POACHING_FINDINGS_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
}

export const getAllAntiPoachingFindingsMasterService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .query(`
        SELECT [ANTI_POACHING_FINDINGS_ID]
              ,[ANTI_POACHING_FINDINGS_NAME]
              ,[ANTI_POACHING_FINDINGS_DESCRIPTION]
              ,[REMARKS]
              ,Case when STATUS_MASTER ='AC' THEN 'ACTIVE' ELSE 'INACTIVE' END [STATUS_MASTER]
        FROM [VMaster].[TBL_ANTI_POACHING_FINDINGS_MASTER]
        ORDER BY ANTI_POACHING_FINDINGS_ID DESC 
      `);
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_ANTI_POACHING_FINDINGS_MASTER SP error:", error);
    throw error;
  }
};

export const getAntiPoachingFindingsMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("ANTI_POACHING_FINDINGS_ID", sql.Int, id)
      .execute("VMaster.GET_ANTI_POACHING_FINDINGS_MASTER");
    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_ANTI_POACHING_FINDINGS_MASTER SP error:", error);
    throw error;
  }
};

export const saveAntiPoachingFindingsMasterService = async (data: AntiPoachingFindingsMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("ANTI_POACHING_FINDINGS_ID", sql.Int, data.ANTI_POACHING_FINDINGS_ID ?? 0)
      .input("ANTI_POACHING_FINDINGS_NAME", sql.VarChar(50), data.ANTI_POACHING_FINDINGS_NAME || null)
      .input("ANTI_POACHING_FINDINGS_DESCRIPTION", sql.VarChar(50), data.ANTI_POACHING_FINDINGS_DESCRIPTION || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), normalizeStatus(data.STATUS_MASTER))
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_ANTI_POACHING_FINDINGS_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save anti-poaching findings");

    return { message: message || "Data saved successfully", ANTI_POACHING_FINDINGS_ID: savedData };
  } catch (error) {
    console.error("SAVE_ANTI_POACHING_FINDINGS_MASTER SP error:", error);
    throw error;
  }
};

export const updateAntiPoachingFindingsMasterService = async (data: AntiPoachingFindingsMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("ANTI_POACHING_FINDINGS_ID", sql.Int, data.ANTI_POACHING_FINDINGS_ID ?? 0)
      .input("ANTI_POACHING_FINDINGS_NAME", sql.VarChar(50), data.ANTI_POACHING_FINDINGS_NAME || null)
      .input("ANTI_POACHING_FINDINGS_DESCRIPTION", sql.VarChar(50), data.ANTI_POACHING_FINDINGS_DESCRIPTION || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), normalizeStatus(data.STATUS_MASTER))
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.UPDATE_ANTI_POACHING_FINDINGS_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to update anti-poaching findings");

    return { message: message || "Record updated successfully", ANTI_POACHING_FINDINGS_ID: savedData };
  } catch (error) {
    console.error("UPDATE_ANTI_POACHING_FINDINGS_MASTER SP error:", error);
    throw error;
  }
};

export const deleteAntiPoachingFindingsMasterService = async (id: number, user = "Admin", role = "Admin", macAddress = "WEB") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("ANTI_POACHING_FINDINGS_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user)
      .input("ROLE", sql.VarChar(50), role)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VMaster.DELETE_ANTI_POACHING_FINDINGS_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete anti-poaching findings");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_ANTI_POACHING_FINDINGS_MASTER SP error:", error);
    throw error;
  }
};