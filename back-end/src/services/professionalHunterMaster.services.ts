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

export interface ProfessionalHunterMasterData {
  PH_ID?: number;
  PH_NAME: string;
  PH_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
}

export const getAllProfessionalHunterMasterService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .query(`
        SELECT [PH_ID]
              ,[PH_NAME]
              ,[PH_DESCRIPTION]
              ,[REMARKS]
              ,Case when STATUS_MASTER ='AC' THEN 'ACTIVE' ELSE 'INACTIVE' END [STATUS_MASTER]
        FROM [VMaster].[TBL_PROFESSIONAL_HUNTER_MASTER]
        ORDER BY PH_ID DESC
      `);
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_PROFESSIONAL_HUNTER_MASTER SP error:", error);
    throw error;
  }
};

export const getProfessionalHunterMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PH_ID", sql.Int, id)
      .execute("VMaster.GET_PROFESSIONAL_HUNTER_MASTER");
    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_PROFESSIONAL_HUNTER_MASTER SP error:", error);
    throw error;
  }
};

export const saveProfessionalHunterMasterService = async (data: ProfessionalHunterMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PH_ID", sql.Int, data.PH_ID ?? 0)
      .input("PH_NAME", sql.VarChar(50), data.PH_NAME || null)
      .input("PH_DESCRIPTION", sql.VarChar(50), data.PH_DESCRIPTION || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), normalizeStatus(data.STATUS_MASTER))
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_PROFESSIONAL_HUNTER_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save professional hunter");

    return { message: message || "Data saved successfully", PH_ID: savedData };
  } catch (error) {
    console.error("SAVE_PROFESSIONAL_HUNTER_MASTER SP error:", error);
    throw error;
  }
};

export const updateProfessionalHunterMasterService = async (data: ProfessionalHunterMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PH_ID", sql.Int, data.PH_ID ?? 0)
      .input("PH_NAME", sql.VarChar(50), data.PH_NAME || null)
      .input("PH_DESCRIPTION", sql.VarChar(50), data.PH_DESCRIPTION || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), normalizeStatus(data.STATUS_MASTER))
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.UPDATE_PROFESSIONAL_HUNTER_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to update professional hunter");

    return { message: message || "Record updated successfully", PH_ID: savedData };
  } catch (error) {
    console.error("UPDATE_PROFESSIONAL_HUNTER_MASTER SP error:", error);
    throw error;
  }
};

export const deleteProfessionalHunterMasterService = async (id: number, user = "Admin", role = "Admin", macAddress = "WEB") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PH_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user)
      .input("ROLE", sql.VarChar(50), role)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VMaster.DELETE_PROFESSIONAL_HUNTER_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete professional hunter");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_PROFESSIONAL_HUNTER_MASTER SP error:", error);
    throw error;
  }
};