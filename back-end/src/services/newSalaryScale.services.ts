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
}

const serializeRecordset = (rows: any[]) =>
  (rows || []).map((r: any) => ({ ...r, id: r.SALARY_SCALE_ID }));

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

export const getNewSalaryScaleByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SALARY_SCALE_ID", sql.Int, id)
      .execute("VMaster.GET_NEW_SALARY_SCALE");

    return result.recordset[0] || null;
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
    request.input("DESIGNATION_GROUP_ID", sql.Int, data.DESIGNATION_GROUP_ID ?? null);
    request.input("SALARY_SCALE_NAME", sql.VarChar(100), data.SALARY_SCALE_NAME || null);
    request.input("BASIC", sql.Int, data.BASIC ?? null);
    request.input("FOT", sql.Int, data.FOT ?? null);
    request.input("ATTENDANCE", sql.Int, data.ATTENDANCE ?? null);
    request.input("ONE_1YP", sql.Int, data.ONE_1YP ?? null);
    request.input("TECHNICAL", sql.Int, data.TECHNICAL ?? null);
    request.input("POLYVALENT", sql.Int, data.POLYVALENT ?? null);
    request.input("RESPONSIBILITY", sql.Int, data.RESPONSIBILITY ?? null);
    request.input("LOYALTY", sql.Int, data.LOYALTY ?? null);
    request.input("NIGHT_ALLOWANCE", sql.Int, data.NIGHT_ALLOWANCE ?? null);
    request.input("MISCELLANIES", sql.Int, data.MISCELLANIES ?? null);
    request.input("PRODUCTIVITY", sql.Int, data.PRODUCTIVITY ?? null);
    request.input("CAPACITY", sql.Int, data.CAPACITY ?? null);
    request.input("DISCIPLINARY", sql.Int, data.DISCIPLINARY ?? null);
    request.input("HOUSE_ALLOW", sql.Int, data.HOUSE_ALLOW ?? null);
    request.input("MEDICIAL", sql.Int, data.MEDICIAL ?? null);
    request.input("EDUCATION", sql.Int, data.EDUCATION ?? null);
    request.input("EXTRA1", sql.Int, data.EXTRA1 ?? null);
    request.input("EXTRA2", sql.Int, data.EXTRA2 ?? null);
    request.input("EXTRA3", sql.Int, data.EXTRA3 ?? null);
    request.input("EXTRA4", sql.Int, data.EXTRA4 ?? null);
    request.input("EXTRA5", sql.Int, data.EXTRA5 ?? null);
    request.input("EXTRA6", sql.Int, data.EXTRA6 ?? null);
    request.input("TOTAL", sql.Int, data.TOTAL ?? null);
    request.input("OT_NONOT", sql.VarChar(30), data.OT_NONOT || null);
    request.input("REMARKS", sql.VarChar(1000), data.REMARKS || null);
    request.input("STATUS_MASTER", sql.VarChar(10), data.STATUS_MASTER || null);
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

    const result = await request.execute("VMaster.SAVE_NEW_SALARY_SCALE");
    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save salary scale");

    const newId = result.output?.SALARY_SCALE_ID ?? savedData;
    return { message: message || "Data saved successfully", SALARY_SCALE_ID: newId };
  } catch (error) {
    console.error("SAVE_NEW_SALARY_SCALE SP error:", error);
    throw error;
  }
};

export const updateNewSalaryScaleService = async (data: NewSalaryScaleData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SALARY_SCALE_ID", sql.Int, data.SALARY_SCALE_ID ?? 0)
      .input("DESIGNATION_GROUP_ID", sql.Int, data.DESIGNATION_GROUP_ID ?? null)
      .input("SALARY_SCALE_NAME", sql.VarChar(100), data.SALARY_SCALE_NAME ?? null)
      .input("BASIC", sql.Int, data.BASIC ?? null)
      .input("FOT", sql.Int, data.FOT ?? null)
      .input("ATTENDANCE", sql.Int, data.ATTENDANCE ?? null)
      .input("ONE_1YP", sql.Int, data.ONE_1YP ?? null)
      .input("TECHNICAL", sql.Int, data.TECHNICAL ?? null)
      .input("POLYVALENT", sql.Int, data.POLYVALENT ?? null)
      .input("RESPONSIBILITY", sql.Int, data.RESPONSIBILITY ?? null)
      .input("LOYALTY", sql.Int, data.LOYALTY ?? null)
      .input("NIGHT_ALLOWANCE", sql.Int, data.NIGHT_ALLOWANCE ?? null)
      .input("MISCELLANIES", sql.Int, data.MISCELLANIES ?? null)
      .input("PRODUCTIVITY", sql.Int, data.PRODUCTIVITY ?? null)
      .input("CAPACITY", sql.Int, data.CAPACITY ?? null)
      .input("DISCIPLINARY", sql.Int, data.DISCIPLINARY ?? null)
      .input("HOUSE_ALLOW", sql.Int, data.HOUSE_ALLOW ?? null)
      .input("MEDICIAL", sql.Int, data.MEDICIAL ?? null)
      .input("EDUCATION", sql.Int, data.EDUCATION ?? null)
      .input("EXTRA1", sql.Int, data.EXTRA1 ?? null)
      .input("EXTRA2", sql.Int, data.EXTRA2 ?? null)
      .input("EXTRA3", sql.Int, data.EXTRA3 ?? null)
      .input("EXTRA4", sql.Int, data.EXTRA4 ?? null)
      .input("EXTRA5", sql.Int, data.EXTRA5 ?? null)
      .input("EXTRA6", sql.Int, data.EXTRA6 ?? null)
      .input("TOTAL", sql.Int, data.TOTAL ?? null)
      .input("OT_NONOT", sql.VarChar(30), data.OT_NONOT ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(10), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_NEW_SALARY_SCALE");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update salary scale");

    return { message: message || "Record updated successfully" };
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
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_NEW_SALARY_SCALE");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete salary scale");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    const msg = (error as any)?.message || "";
    if (msg.includes("REFERENCE constraint") || msg.includes("FK_")) {
      throw new Error("Cannot delete: This salary scale has associated records.");
    }
    throw error;
  }
};