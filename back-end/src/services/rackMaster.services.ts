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

export interface RackMasterData {
  RACK_ID?: number;
  RACK_NAME: string;
  RACK_DESCRIPTION?: string;
  COMPANY_ID?: number;
  CAMP_ID?: number;
  STORE_ID?: number;
  RACK_SECTION_ID?: number;
  MAX_CAPACITY?: number;
  STATUS_MASTER?: string;
  REMARKS?: string;
  USER?: string;
  MAC_ADDRESS?: string;
}

export const getAllRackMasterService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .query(`
        SELECT r.[RACK_ID]
              ,r.[RACK_NAME]
              ,r.[RACK_DESCRIPTION]
              ,r.[COMPANY_ID]
              ,c.[COMPANY_NAME]
              ,r.[CAMP_ID]
              ,cm.[CAMP_NAME]
              ,r.[STORE_ID]
              ,s.[Store_Name] [STORE_NAME]
              ,r.[RACK_SECTION_ID]
              ,rs.[RACK_SECTION_NAME]
              ,r.[MAX_CAPACITY]
              ,r.[REMARKS]
              ,Case when r.[STATUS_MASTER] ='AC' THEN 'ACTIVE' ELSE 'INACTIVE' END [STATUS_MASTER]
        FROM [VMaster].[TBL_RACK_MASTER] r
        LEFT JOIN [VMaster].[TBL_COMPANY_MASTER] c ON r.COMPANY_ID = c.COMPANY_ID
        LEFT JOIN [VMaster].[TBL_CAMP_MASTER] cm ON r.CAMP_ID = cm.CAMP_ID
        LEFT JOIN [VMaster].[tbl_Store_Master] s ON r.STORE_ID = s.Store_Id
        LEFT JOIN [VMaster].[TBL_RACK_SECTION_MASTER] rs ON r.RACK_SECTION_ID = rs.RACK_SECTION_ID
        ORDER BY r.[RACK_ID] DESC
      `);
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_RACK_MASTER query error:", error);
    throw error;
  }
};

export const getRackMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("RACK_ID", sql.Int, id)
      .execute("VMaster.GET_RACK_MASTER");
    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_RACK_MASTER SP error:", error);
    throw error;
  }
};

export const saveRackMasterService = async (data: RackMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("RACK_ID", sql.Int, data.RACK_ID ?? 0)
      .input("RACK_NAME", sql.VarChar(40), data.RACK_NAME || null)
      .input("RACK_DESCRIPTION", sql.VarChar(100), data.RACK_DESCRIPTION || null)
      .input("COMPANY_ID", sql.Int, data.COMPANY_ID ?? null)
      .input("CAMP_ID", sql.Int, data.CAMP_ID ?? null)
      .input("STORE_ID", sql.Int, data.STORE_ID ?? null)
      .input("RACK_SECTION_ID", sql.Int, data.RACK_SECTION_ID ?? null)
      .input("MAX_CAPACITY", sql.Int, data.MAX_CAPACITY ?? 0)
      .input("STATUS_MASTER", sql.VarChar(20), normalizeStatus(data.STATUS_MASTER))
      .input("REMARKS", sql.VarChar(100), data.REMARKS || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_RACK_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save rack");

    return { message: message || "Data saved successfully", RACK_ID: savedData };
  } catch (error) {
    console.error("SAVE_RACK_MASTER SP error:", error);
    throw error;
  }
};

export const updateRackMasterService = async (data: RackMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("RACK_ID", sql.Int, data.RACK_ID ?? 0)
      .input("RACK_NAME", sql.VarChar(40), data.RACK_NAME || null)
      .input("RACK_DESCRIPTION", sql.VarChar(100), data.RACK_DESCRIPTION || null)
      .input("COMPANY_ID", sql.Int, data.COMPANY_ID ?? null)
      .input("CAMP_ID", sql.Int, data.CAMP_ID ?? null)
      .input("STORE_ID", sql.Int, data.STORE_ID ?? null)
      .input("RACK_SECTION_ID", sql.Int, data.RACK_SECTION_ID ?? null)
      .input("MAX_CAPACITY", sql.Int, data.MAX_CAPACITY ?? 0)
      .input("STATUS_MASTER", sql.VarChar(20), normalizeStatus(data.STATUS_MASTER))
      .input("REMARKS", sql.VarChar(100), data.REMARKS || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.UPDATE_RACK_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to update rack");

    return { message: message || "Record updated successfully", RACK_ID: savedData };
  } catch (error) {
    console.error("UPDATE_RACK_MASTER SP error:", error);
    throw error;
  }
};

export const deleteRackMasterService = async (id: number, user = "Admin", role = "Admin", macAddress = "WEB") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("RACK_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user)
      .input("ROLE", sql.VarChar(50), role)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VMaster.DELETE_RACK_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete rack");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_RACK_MASTER SP error:", error);
    throw error;
  }
};