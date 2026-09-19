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

export interface RackSectionMasterData {
  RACK_SECTION_ID?: number;
  RACK_SECTION_NAME: string;
  RACK_SECTION_DESCRIPTION?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
}

export const getAllRackSectionMasterService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .query(`
        SELECT [RACK_SECTION_ID]
              ,[RACK_SECTION_NAME]
              ,[RACK_SECTION_DESCRIPTION]
              ,Case when STATUS_MASTER ='AC' THEN 'ACTIVE' ELSE 'INACTIVE' END [STATUS_MASTER]
        FROM [VMaster].[TBL_RACK_SECTION_MASTER]
        ORDER BY RACK_SECTION_ID DESC
      `);
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_RACK_SECTION_MASTER query error:", error);
    throw error;
  }
};

export const getRackSectionMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("RACK_SECTION_ID", sql.Int, id)
      .execute("VMaster.GET_RACK_SECTION_MASTER");
    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_RACK_SECTION_MASTER SP error:", error);
    throw error;
  }
};

export const saveRackSectionMasterService = async (data: RackSectionMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("RACK_SECTION_ID", sql.Int, data.RACK_SECTION_ID ?? 0)
      .input("RACK_SECTION_NAME", sql.VarChar(10), data.RACK_SECTION_NAME || null)
      .input("RACK_SECTION_DESCRIPTION", sql.VarChar(100), data.RACK_SECTION_DESCRIPTION || null)
      .input("STATUS_MASTER", sql.VarChar(20), normalizeStatus(data.STATUS_MASTER))
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_RACK_SECTION_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save rack section");

    return { message: message || "Data saved successfully", RACK_SECTION_ID: savedData };
  } catch (error) {
    console.error("SAVE_RACK_SECTION_MASTER SP error:", error);
    throw error;
  }
};

export const updateRackSectionMasterService = async (data: RackSectionMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("RACK_SECTION_ID", sql.Int, data.RACK_SECTION_ID ?? 0)
      .input("RACK_SECTION_NAME", sql.VarChar(10), data.RACK_SECTION_NAME || null)
      .input("RACK_SECTION_DESCRIPTION", sql.VarChar(100), data.RACK_SECTION_DESCRIPTION || null)
      .input("STATUS_MASTER", sql.VarChar(20), normalizeStatus(data.STATUS_MASTER))
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.UPDATE_RACK_SECTION_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to update rack section");

    return { message: message || "Record updated successfully", RACK_SECTION_ID: savedData };
  } catch (error) {
    console.error("UPDATE_RACK_SECTION_MASTER SP error:", error);
    throw error;
  }
};

export const deleteRackSectionMasterService = async (id: number, user = "Admin", role = "Admin", macAddress = "WEB") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("RACK_SECTION_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user)
      .input("ROLE", sql.VarChar(50), role)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VMaster.DELETE_RACK_SECTION_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete rack section");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_RACK_SECTION_MASTER SP error:", error);
    throw error;
  }
};