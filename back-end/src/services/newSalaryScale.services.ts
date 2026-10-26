import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface NewSalaryScaleData {
  SALARY_SCALE_ID?: number;
  DESIGNATION_GROUP_ID?: number;
  SALARY_SCALE_NAME?: string;
  BASIC?: number;
  FOT?: number;
  ATTENDANCE?: number;
  ONE_1YP?: number;
  TECHNICAL?: number;
  POLYVALENT?: number;
  RESPONSIBILITY?: number;
  LOYALTY?: number;
  NIGHT_ALLOWANCE?: number;
  MISCELLANIES?: number;
  PRODUCTIVITY?: number;
  CAPACITY?: number;
  DISCIPLINARY?: number;
  HOUSE_ALLOW?: number;
  MEDICIAL?: number;
  EDUCATION?: number;
  EXTRA1?: number;
  EXTRA2?: number;
  EXTRA3?: number;
  EXTRA4?: number;
  EXTRA5?: number;
  EXTRA6?: number;
  TOTAL?: number;
  OT_NONOT?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
  LINK_ID?: number | null;
}

const toInt = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

const serializeRecordset = (rows: any[]) =>
  (rows || []).map((r: any) => ({ ...r, id: r.SALARY_SCALE_ID, LINK_ID: r.LINK_ID ?? 92 }));

export const getAllNewSalaryScaleService = async (status?: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    if (status === "ALL" || !status) {
      const statuses = ["AC", "IA"];
      let allRows: any[] = [];
      for (const s of statuses) {
        const result = await pool
          .request()
          .input("STATUS", sql.VarChar(50), s)
          .execute("VMaster.SHOW_NEW_SALARY_SCALE");
        allRows = allRows.concat(result.recordset || []);
      }
      return serializeRecordset(allRows);
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(50), status)
      .execute("VMaster.SHOW_NEW_SALARY_SCALE");
    return serializeRecordset(result.recordset || []);
  } catch (error) {
    console.error("SHOW_NEW_SALARY_SCALE SP error:", error);
    throw error;
  }
};

export const getNewSalaryScaleByIdService = async (id: number, linkId?: number | null) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const resolvedLinkId = toInt(linkId) ?? 92;

  try {
    const result = await pool
      .request()
      .input("SALARY_SCALE_ID", sql.Int, id)
      .input("LINK_ID", sql.Int, resolvedLinkId)
      .execute("VMaster.GET_NEW_SALARY_SCALE");

    if (result.recordset?.[0]) {
      return { ...result.recordset[0], LINK_ID: resolvedLinkId };
    }

    // Fallback if record exists with different/null link_id
    const fallback = await pool
      .request()
      .input("SALARY_SCALE_ID", sql.Int, id)
      .query(`SELECT * FROM VMaster.TBL_NEW_SALARY_SCALE WHERE SALARY_SCALE_ID = @SALARY_SCALE_ID`);
    const fallbackRow = fallback.recordset[0] || null;
    return fallbackRow ? { ...fallbackRow, LINK_ID: resolvedLinkId } : null;
  } catch (error) {
    console.error("GET_NEW_SALARY_SCALE SP error:", error);
    throw error;
  }
};

export const saveNewSalaryScaleService = async (data: NewSalaryScaleData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const request = pool.request();
    request.output("SALARY_SCALE_ID", sql.Int);
    request.input("DESIGNATION_GROUP_ID", sql.Int, toInt(data.DESIGNATION_GROUP_ID) ?? null);
    request.input("SALARY_SCALE_NAME", sql.VarChar(100), data.SALARY_SCALE_NAME || null);
    request.input("BASIC", sql.Int, toInt(data.BASIC) ?? null);
    request.input("FOT", sql.Int, toInt(data.FOT) ?? null);
    request.input("ATTENDANCE", sql.Int, toInt(data.ATTENDANCE) ?? null);
    request.input("ONE_1YP", sql.Int, toInt(data.ONE_1YP) ?? null);
    request.input("TECHNICAL", sql.Int, toInt(data.TECHNICAL) ?? null);
    request.input("POLYVALENT", sql.Int, toInt(data.POLYVALENT) ?? null);
    request.input("RESPONSIBILITY", sql.Int, toInt(data.RESPONSIBILITY) ?? null);
    request.input("LOYALTY", sql.Int, toInt(data.LOYALTY) ?? null);
    request.input("NIGHT_ALLOWANCE", sql.Int, toInt(data.NIGHT_ALLOWANCE) ?? null);
    request.input("MISCELLANIES", sql.Int, toInt(data.MISCELLANIES) ?? null);
    request.input("PRODUCTIVITY", sql.Int, toInt(data.PRODUCTIVITY) ?? null);
    request.input("CAPACITY", sql.Int, toInt(data.CAPACITY) ?? null);
    request.input("DISCIPLINARY", sql.Int, toInt(data.DISCIPLINARY) ?? null);
    request.input("HOUSE_ALLOW", sql.Int, toInt(data.HOUSE_ALLOW) ?? null);
    request.input("MEDICIAL", sql.Int, toInt(data.MEDICIAL) ?? null);
    request.input("EDUCATION", sql.Int, toInt(data.EDUCATION) ?? null);
    request.input("EXTRA1", sql.Int, toInt(data.EXTRA1) ?? null);
    request.input("EXTRA2", sql.Int, toInt(data.EXTRA2) ?? null);
    request.input("EXTRA3", sql.Int, toInt(data.EXTRA3) ?? null);
    request.input("EXTRA4", sql.Int, toInt(data.EXTRA4) ?? null);
    request.input("EXTRA5", sql.Int, toInt(data.EXTRA5) ?? null);
    request.input("EXTRA6", sql.Int, toInt(data.EXTRA6) ?? null);
    request.input("TOTAL", sql.Int, toInt(data.TOTAL) ?? null);
    request.input("OT_NONOT", sql.VarChar(30), data.OT_NONOT || null);
    request.input("REMARKS", sql.VarChar(1000), data.REMARKS || null);
    request.input("STATUS_MASTER", sql.VarChar(10), data.STATUS_MASTER || "AC");
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

    const result = await request.execute("VMaster.SAVE_NEW_SALARY_SCALE");
    const { message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save salary scale");

    let newId = toInt(result.output?.SALARY_SCALE_ID) || toInt(savedData);
    if (!newId || newId === 0) {
      const idRes = await pool
        .request()
        .input("SALARY_SCALE_NAME", sql.VarChar(100), data.SALARY_SCALE_NAME)
        .query(
          `SELECT TOP 1 SALARY_SCALE_ID FROM VMaster.TBL_NEW_SALARY_SCALE WHERE SALARY_SCALE_NAME = @SALARY_SCALE_NAME ORDER BY SALARY_SCALE_ID DESC`
        );
      newId = idRes.recordset?.[0]?.SALARY_SCALE_ID;
    }

    const resolvedLinkId = toInt(data.LINK_ID) ?? 92;
    if (newId) {
      await pool
        .request()
        .input("LINK_ID", sql.Int, resolvedLinkId)
        .input("SALARY_SCALE_ID", sql.Int, newId)
        .query(
          `UPDATE VMaster.TBL_NEW_SALARY_SCALE SET LINK_ID = @LINK_ID WHERE SALARY_SCALE_ID = @SALARY_SCALE_ID AND (LINK_ID IS NULL OR LINK_ID = 0)`
        );
    }

    return {
      message: message || "DATA SAVED SUCCESSFULLY",
      SALARY_SCALE_ID: newId,
    };
  } catch (error) {
    console.error("SAVE_NEW_SALARY_SCALE SP error:", error);
    throw error;
  }
};

export const updateNewSalaryScaleService = async (data: NewSalaryScaleData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const request = pool.request();
    request.output("SALARY_SCALE_ID", sql.Int);
    request.input("DESIGNATION_GROUP_ID", sql.Int, toInt(data.DESIGNATION_GROUP_ID) ?? null);
    request.input("SALARY_SCALE_NAME", sql.VarChar(100), data.SALARY_SCALE_NAME ?? null);
    request.input("BASIC", sql.Int, toInt(data.BASIC) ?? null);
    request.input("FOT", sql.Int, toInt(data.FOT) ?? null);
    request.input("ATTENDANCE", sql.Int, toInt(data.ATTENDANCE) ?? null);
    request.input("ONE_1YP", sql.Int, toInt(data.ONE_1YP) ?? null);
    request.input("TECHNICAL", sql.Int, toInt(data.TECHNICAL) ?? null);
    request.input("POLYVALENT", sql.Int, toInt(data.POLYVALENT) ?? null);
    request.input("RESPONSIBILITY", sql.Int, toInt(data.RESPONSIBILITY) ?? null);
    request.input("LOYALTY", sql.Int, toInt(data.LOYALTY) ?? null);
    request.input("NIGHT_ALLOWANCE", sql.Int, toInt(data.NIGHT_ALLOWANCE) ?? null);
    request.input("MISCELLANIES", sql.Int, toInt(data.MISCELLANIES) ?? null);
    request.input("PRODUCTIVITY", sql.Int, toInt(data.PRODUCTIVITY) ?? null);
    request.input("CAPACITY", sql.Int, toInt(data.CAPACITY) ?? null);
    request.input("DISCIPLINARY", sql.Int, toInt(data.DISCIPLINARY) ?? null);
    request.input("HOUSE_ALLOW", sql.Int, toInt(data.HOUSE_ALLOW) ?? null);
    request.input("MEDICIAL", sql.Int, toInt(data.MEDICIAL) ?? null);
    request.input("EDUCATION", sql.Int, toInt(data.EDUCATION) ?? null);
    request.input("EXTRA1", sql.Int, toInt(data.EXTRA1) ?? null);
    request.input("EXTRA2", sql.Int, toInt(data.EXTRA2) ?? null);
    request.input("EXTRA3", sql.Int, toInt(data.EXTRA3) ?? null);
    request.input("EXTRA4", sql.Int, toInt(data.EXTRA4) ?? null);
    request.input("EXTRA5", sql.Int, toInt(data.EXTRA5) ?? null);
    request.input("EXTRA6", sql.Int, toInt(data.EXTRA6) ?? null);
    request.input("TOTAL", sql.Int, toInt(data.TOTAL) ?? null);
    request.input("OT_NONOT", sql.VarChar(30), data.OT_NONOT ?? null);
    request.input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null);
    request.input("STATUS_MASTER", sql.VarChar(10), data.STATUS_MASTER ?? "AC");
    request.input("USER", sql.VarChar(50), data.USER ?? "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB");
    request.input("LINK_ID", sql.Int, toInt(data.LINK_ID) ?? 92);

    const result = await request.execute("VMaster.UPDATE_NEW_SALARY_SCALE");
    const { message, data: updatedId } = parseSprocResult(result.recordset?.[0], "Failed to update salary scale");

    return {
      message: message || "RECORD UPDATED SUCCESSFULLY",
      SALARY_SCALE_ID: toInt(result.output?.SALARY_SCALE_ID) || toInt(updatedId) || toInt(data.SALARY_SCALE_ID),
    };
  } catch (error) {
    console.error("UPDATE_NEW_SALARY_SCALE SP error:", error);
    throw error;
  }
};

export const deleteNewSalaryScaleService = async (
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
      .input("SALARY_SCALE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_NEW_SALARY_SCALE");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to delete salary scale");
    return { message: message || "RECORD DELETED SUCCESSFULLY" };
  } catch (error) {
    const msg = (error as any)?.message || "";
    if (msg.includes("REFERENCE constraint") || msg.includes("FK_")) {
      throw new Error("Cannot delete: This salary scale has associated records.");
    }
    console.error("DELETE_NEW_SALARY_SCALE SP error:", error);
    throw error;
  }
};