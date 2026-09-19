import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface CompanyDepartmentDesignationMappingData {
  SNO?: number;
  COMPANY_ID?: number;
  DEPARTMENT_ID?: number;
  DESIGNATION_ID?: number;
  DEPARTMENT_GROUP_ID?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const serializeRecordset = (rows: any[]) =>
  (rows || []).map((r: any) => ({ ...r, id: r.SNO }));

export const getAllMappingService = async (status?: string) => {
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
          .execute("VMaster.SHOW_COMPANY_DEPARTMENT_DESIGNATION_MAPPING");
        allRows = allRows.concat(result.recordset || []);
      }
      return serializeRecordset(allRows);
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(50), status)
      .execute("VMaster.SHOW_COMPANY_DEPARTMENT_DESIGNATION_MAPPING");
    return serializeRecordset(result.recordset || []);
  } catch (error) {
    console.error("SHOW_COMPANY_DEPARTMENT_DESIGNATION_MAPPING SP error:", error);
    throw error;
  }
};

export const getMappingByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, id)
      .execute("VMaster.GET_COMPANY_DEPARTMENT_DESIGNATION_MAPPING");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_COMPANY_DEPARTMENT_DESIGNATION_MAPPING SP error:", error);
    throw error;
  }
};

export const saveMappingService = async (data: CompanyDepartmentDesignationMappingData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const request = pool.request();
    request.output("SNO", sql.Int);
    request.input("COMPANY_ID", sql.Int, data.COMPANY_ID ?? null);
    request.input("DEPARTMENT_ID", sql.Int, data.DEPARTMENT_ID ?? null);
    request.input("DESIGNATION_ID", sql.Int, data.DESIGNATION_ID ?? null);
    request.input("DEPARTMENT_GROUP_ID", sql.Int, data.DEPARTMENT_GROUP_ID ?? null);
    request.input("REMARKS", sql.VarChar(1000), data.REMARKS || null);
    request.input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null);
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

    const result = await request.execute("VMaster.SAVE_COMPANY_DEPARTMENT_DESIGNATION_MAPPING");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save mapping");

    const newId = savedData ?? result.output?.SNO;
    return { message: message || "Data saved successfully", SNO: newId };
  } catch (error) {
    console.error("SAVE_COMPANY_DEPARTMENT_DESIGNATION_MAPPING SP error:", error);
    throw error;
  }
};

export const updateMappingService = async (data: CompanyDepartmentDesignationMappingData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, data.SNO ?? 0)
      .input("COMPANY_ID", sql.Int, data.COMPANY_ID ?? null)
      .input("DEPARTMENT_ID", sql.Int, data.DEPARTMENT_ID ?? null)
      .input("DESIGNATION_ID", sql.Int, data.DESIGNATION_ID ?? null)
      .input("DEPARTMENT_GROUP_ID", sql.Int, data.DEPARTMENT_GROUP_ID ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_COMPANY_DEPARTMENT_DESIGNATION_MAPPING");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update mapping");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_COMPANY_DEPARTMENT_DESIGNATION_MAPPING SP error:", error);
    throw error;
  }
};

export const deleteMappingService = async (
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
      .input("SNO", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_COMPANY_DEPARTMENT_DESIGNATION_MAPPING");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete mapping");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    const msg = (error as any)?.message || "";
    if (msg.includes("REFERENCE constraint") || msg.includes("FK_")) {
      throw new Error("Cannot delete: This mapping has associated records.");
    }
    throw error;
  }
};