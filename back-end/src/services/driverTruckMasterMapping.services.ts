import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface DriverTruckMasterMappingData {
  SNO?: number;
  DRIVER_EMP_ID?: number;
  TRUCK_ID?: number;
  EFFECTIVE_FROM?: Date | string;
  SECTION_HEAD_RESPONSE_PERSON_EMP_ID?: number;
  SECTION_HEAD_RESPONSE_DATE?: Date | string;
  SECTION_HEAD_RESPONSE_STATUS?: string;
  SECTION_HEAD_RESPONSE_REMARKS?: string;
  RESPONSE_1_EMP_ID?: number;
  RESPONSE_1_DATE?: Date | string;
  RESPONSE_1_STATUS?: string;
  RESPONSE_1_REMARKS?: string;
  RESPONSE_2_EMP_ID?: number;
  RESPONSE_2_DATE?: Date | string;
  RESPONSE_2_STATUS?: string;
  RESPONSE_2_REMARKS?: string;
  FINAL_RESPONSE_PERSON?: string;
  FINAL_RESPONSE_DATE?: Date | string;
  FINAL_RESPONSE_STATUS?: string;
  FINAL_RESPONSE_REMARKS?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const serializeRecordset = (rows: any[]) =>
  (rows || []).map((r: any) => ({ ...r, id: r.SNO }));

const toDateTime = (value?: Date | string): Date | null => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

export const getAllMappingService = async (status?: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    if (status === "ALL" || !status) {
      const statuses = ["AC", "IN"];
      let allRows: any[] = [];
      for (const s of statuses) {
        const result = await pool
          .request()
          .input("STATUS", sql.VarChar(50), s)
          .execute("VMaster.SHOW_DRIVER_TRUCK_MASTER_MAPPING");
        allRows = allRows.concat(result.recordset || []);
      }
      return serializeRecordset(allRows);
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(50), status)
      .execute("VMaster.SHOW_DRIVER_TRUCK_MASTER_MAPPING");
    return serializeRecordset(result.recordset || []);
  } catch (error) {
    console.error("SHOW_DRIVER_TRUCK_MASTER_MAPPING SP error:", error);
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
      .execute("VMaster.GET_DRIVER_TRUCK_MASTER_MAPPING");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_DRIVER_TRUCK_MASTER_MAPPING SP error:", error);
    throw error;
  }
};

export const saveMappingService = async (data: DriverTruckMasterMappingData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const request = pool.request();
    request.output("SNO", sql.Int);
    request.input("DRIVER_EMP_ID", sql.Int, data.DRIVER_EMP_ID ?? null);
    request.input("TRUCK_ID", sql.Int, data.TRUCK_ID ?? null);
    request.input("EFFECTIVE_FROM", sql.DateTime, toDateTime(data.EFFECTIVE_FROM));
    request.input("SECTION_HEAD_RESPONSE_PERSON_EMP_ID", sql.Int, data.SECTION_HEAD_RESPONSE_PERSON_EMP_ID ?? null);
    request.input("SECTION_HEAD_RESPONSE_DATE", sql.DateTime, toDateTime(data.SECTION_HEAD_RESPONSE_DATE));
    request.input("SECTION_HEAD_RESPONSE_STATUS", sql.VarChar(50), data.SECTION_HEAD_RESPONSE_STATUS || null);
    request.input("SECTION_HEAD_RESPONSE_REMARKS", sql.VarChar(50), data.SECTION_HEAD_RESPONSE_REMARKS || null);
    request.input("RESPONSE_1_EMP_ID", sql.Int, data.RESPONSE_1_EMP_ID ?? null);
    request.input("RESPONSE_1_DATE", sql.DateTime, toDateTime(data.RESPONSE_1_DATE));
    request.input("RESPONSE_1_STATUS", sql.VarChar(50), data.RESPONSE_1_STATUS || null);
    request.input("RESPONSE_1_REMARKS", sql.VarChar(50), data.RESPONSE_1_REMARKS || null);
    request.input("RESPONSE_2_EMP_ID", sql.Int, data.RESPONSE_2_EMP_ID ?? null);
    request.input("RESPONSE_2_DATE", sql.DateTime, toDateTime(data.RESPONSE_2_DATE));
    request.input("RESPONSE_2_STATUS", sql.VarChar(50), data.RESPONSE_2_STATUS || null);
    request.input("RESPONSE_2_REMARKS", sql.VarChar(50), data.RESPONSE_2_REMARKS || null);
    request.input("FINAL_RESPONSE_PERSON", sql.VarChar(50), data.FINAL_RESPONSE_PERSON || null);
    request.input("FINAL_RESPONSE_DATE", sql.DateTime, toDateTime(data.FINAL_RESPONSE_DATE));
    request.input("FINAL_RESPONSE_STATUS", sql.VarChar(50), data.FINAL_RESPONSE_STATUS || null);
    request.input("FINAL_RESPONSE_REMARKS", sql.VarChar(50), data.FINAL_RESPONSE_REMARKS || null);
    request.input("REMARKS", sql.VarChar(1000), data.REMARKS || null);
    request.input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null);
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

    const result = await request.execute("VMaster.SAVE_DRIVER_TRUCK_MASTER_MAPPING");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save mapping");

    const newId = savedData ?? result.output?.SNO;
    return { message: message || "Data saved successfully", SNO: newId };
  } catch (error) {
    console.error("SAVE_DRIVER_TRUCK_MASTER_MAPPING SP error:", error);
    throw error;
  }
};

export const updateMappingService = async (data: DriverTruckMasterMappingData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, data.SNO ?? 0)
      .input("DRIVER_EMP_ID", sql.Int, data.DRIVER_EMP_ID ?? null)
      .input("TRUCK_ID", sql.Int, data.TRUCK_ID ?? null)
      .input("EFFECTIVE_FROM", sql.DateTime, toDateTime(data.EFFECTIVE_FROM))
      .input("SECTION_HEAD_RESPONSE_PERSON_EMP_ID", sql.Int, data.SECTION_HEAD_RESPONSE_PERSON_EMP_ID ?? null)
      .input("SECTION_HEAD_RESPONSE_DATE", sql.DateTime, toDateTime(data.SECTION_HEAD_RESPONSE_DATE))
      .input("SECTION_HEAD_RESPONSE_STATUS", sql.VarChar(50), data.SECTION_HEAD_RESPONSE_STATUS ?? null)
      .input("SECTION_HEAD_RESPONSE_REMARKS", sql.VarChar(50), data.SECTION_HEAD_RESPONSE_REMARKS ?? null)
      .input("RESPONSE_1_EMP_ID", sql.Int, data.RESPONSE_1_EMP_ID ?? null)
      .input("RESPONSE_1_DATE", sql.DateTime, toDateTime(data.RESPONSE_1_DATE))
      .input("RESPONSE_1_STATUS", sql.VarChar(50), data.RESPONSE_1_STATUS ?? null)
      .input("RESPONSE_1_REMARKS", sql.VarChar(50), data.RESPONSE_1_REMARKS ?? null)
      .input("RESPONSE_2_EMP_ID", sql.Int, data.RESPONSE_2_EMP_ID ?? null)
      .input("RESPONSE_2_DATE", sql.DateTime, toDateTime(data.RESPONSE_2_DATE))
      .input("RESPONSE_2_STATUS", sql.VarChar(50), data.RESPONSE_2_STATUS ?? null)
      .input("RESPONSE_2_REMARKS", sql.VarChar(50), data.RESPONSE_2_REMARKS ?? null)
      .input("FINAL_RESPONSE_PERSON", sql.VarChar(50), data.FINAL_RESPONSE_PERSON ?? null)
      .input("FINAL_RESPONSE_DATE", sql.DateTime, toDateTime(data.FINAL_RESPONSE_DATE))
      .input("FINAL_RESPONSE_STATUS", sql.VarChar(50), data.FINAL_RESPONSE_STATUS ?? null)
      .input("FINAL_RESPONSE_REMARKS", sql.VarChar(50), data.FINAL_RESPONSE_REMARKS ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_DRIVER_TRUCK_MASTER_MAPPING");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update mapping");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_DRIVER_TRUCK_MASTER_MAPPING SP error:", error);
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
      .execute("VMaster.DELETE_DRIVER_TRUCK_MASTER_MAPPING");

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

export const getDriverOptionsService = async (status = "AC") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(50), status)
      .execute("VMaster.SHOW_DRIVER_MASTER_HDR");

    return (result.recordset || []).map((r: any) => ({
      DRIVER_EMP_ID: r.DRIVER_EMP_ID,
      DRIVER_FULL_NAME: r.DRIVER_FULL_NAME,
    }));
  } catch (error) {
    console.error("SHOW_DRIVER_MASTER SP error:", error);
    throw error;
  }
};

export const getTruckOptionsService = async (status = "AC") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(50), status)
      .execute("VMaster.SHOW_TRUCK_MASTER_hdr");

    return (result.recordset || []).map((r: any) => ({
      TRUCK_ID: r.TRUCK_ID,
      TRUCK_NO: r.TRUCK_NO,
    }));
  } catch (error) {
    console.error("SHOW_TRUCK_MASTER_hdr SP error:", error);
    throw error;
  }
};