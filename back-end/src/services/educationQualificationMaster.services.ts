import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface EducationQualificationMasterData {
  EDUCATION_QUALIFICATION_ID?: number;
  EDUCATION_QUALIFICATION_NAME: string;
  SKILL_TYPE?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const normalizeRow = (r: any) => ({
  ...r,
  STATUS_MASTER: r.STATUS_MASTER ?? r.STATUS ?? null,
});

export const getAllEducationQualificationMasterService = async (status = "ALL") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    if (status === "ALL") {
      const statuses = ["AC", "IN"];
      let allRows: any[] = [];
      for (const s of statuses) {
        const result = await pool
          .request()
          .input("STATUS", sql.VarChar(20), s)
          .execute("VMaster.SHOW_EDUCATION_QUALIFICATION_MASTER");
        allRows = allRows.concat(result.recordset || []);
      }
      return allRows.map(normalizeRow);
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(20), status)
      .execute("VMaster.SHOW_EDUCATION_QUALIFICATION_MASTER");
    return (result.recordset || []).map(normalizeRow);
  } catch (error) {
    console.error("SHOW_EDUCATION_QUALIFICATION_MASTER SP error:", error);
    throw error;
  }
};

export const getEducationQualificationMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("EDUCATION_QUALIFICATION_ID", sql.Int, id)
      .execute("VMaster.GET_EDUCATION_QUALIFICATION_MASTER");

    const row = result.recordset[0] || null;
    return row ? normalizeRow(row) : null;
  } catch (error) {
    console.error("GET_EDUCATION_QUALIFICATION_MASTER SP error:", error);
    throw error;
  }
};

export const saveEducationQualificationMasterService = async (data: EducationQualificationMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .output("EDUCATION_QUALIFICATION_ID", sql.Int)
      .input("EDUCATION_QUALIFICATION_NAME", sql.VarChar(50), data.EDUCATION_QUALIFICATION_NAME || null)
      .input("SKILL_TYPE", sql.VarChar(50), data.SKILL_TYPE || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_EDUCATION_QUALIFICATION_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save education qualification");

    const newId = result.output?.EDUCATION_QUALIFICATION_ID ?? savedData;
    return { message: message || "Data saved successfully", EDUCATION_QUALIFICATION_ID: newId };
  } catch (error) {
    console.error("SAVE_EDUCATION_QUALIFICATION_MASTER SP error:", error);
    throw error;
  }
};

export const updateEducationQualificationMasterService = async (data: EducationQualificationMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const existing = await getEducationQualificationMasterByIdService(data.EDUCATION_QUALIFICATION_ID ?? 0);
    if (!existing) {
      throw new Error("RECORD DOES NOT EXIST");
    }

    const result = await pool
      .request()
      .input("EDUCATION_QUALIFICATION_ID", sql.Int, data.EDUCATION_QUALIFICATION_ID ?? 0)
      .input("EDUCATION_QUALIFICATION_NAME", sql.VarChar(50), data.EDUCATION_QUALIFICATION_NAME ?? null)
      .input("SKILL_TYPE", sql.VarChar(50), data.SKILL_TYPE ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_EDUCATION_QUALIFICATION_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update education qualification");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_EDUCATION_QUALIFICATION_MASTER SP error:", error);
    throw error;
  }
};

export const deleteEducationQualificationMasterService = async (
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
      .input("EDUCATION_QUALIFICATION_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_EDUCATION_QUALIFICATION_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete education qualification");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_EDUCATION_QUALIFICATION_MASTER SP error:", error);
    throw error;
  }
};