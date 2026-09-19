import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface ManPowerApprovedSettingsData {
  MAN_POWER_APPROVED_ID?: number;
  COMPANY_ID?: number;
  DEPARTMENT_ID?: number;
  DESIGNATION_ID?: number;
  EMPLOYMENT_TYPE_ID?: number;
  NEW_APPROVED_MAN_POWER?: number;
  MAN_POWER_REQUEST_ID?: number;
  APPROVED_BY?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const normalizeStatus = (status: string | undefined | null): string => {
  if (!status) return "AC";
  const s = status.trim().toUpperCase();
  if (s === "ACTIVE" || s === "AC") return "AC";
  if (s === "INACTIVE" || s === "IN" || s === "IA") return "IA";
  return s.substring(0, 2);
};

const parseResult = (row: any) => {
  if (!row) return { status: "", message: "", data: undefined as any };
  const arr: any[] = Array.isArray(row[""]) ? row[""] : [];
  return {
    status: row.STATUS ?? arr[0] ?? "",
    message: row.MESSAGE ?? arr[1] ?? "",
    data: row.DATA ?? arr[2],
  };
};

export const getAllManPowerApprovedSettingsService = async (status?: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const statuses =
      status === "ALL" || !status ? ["AC", "IA"] : [normalizeStatus(status)];
    let allRows: any[] = [];
    for (const s of statuses) {
      const result = await pool
        .request()
        .input("STATUS", sql.VarChar(20), s)
        .execute("VMaster.SHOW_MAN_POWER_APPROVED_SETTINGS");
      allRows = allRows.concat(result.recordset || []);
    }
    return (allRows || []).map((r: any) => ({ ...r, id: r.MAN_POWER_APPROVED_ID }));
  } catch (error) {
    console.error("SHOW_MAN_POWER_APPROVED_SETTINGS SP error:", error);
    throw error;
  }
};

export const getManPowerApprovedSettingsByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("MAN_POWER_APPROVED_ID", sql.Int, id)
      .execute("VMaster.GET_MAN_POWER_APPROVED_SETTINGS");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_MAN_POWER_APPROVED_SETTINGS SP error:", error);
    throw error;
  }
};

export const saveManPowerApprovedSettingsService = async (data: ManPowerApprovedSettingsData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const request = pool.request();
    request.output("MAN_POWER_APPROVED_ID", sql.Int);
    request.input("COMPANY_ID", sql.Int, data.COMPANY_ID ?? null);
    request.input("DEPARTMENT_ID", sql.Int, data.DEPARTMENT_ID ?? null);
    request.input("DESIGNATION_ID", sql.Int, data.DESIGNATION_ID ?? null);
    request.input("EMPLOYMENT_TYPE_ID", sql.Int, data.EMPLOYMENT_TYPE_ID ?? null);
    request.input("NEW_APPROVED_MAN_POWER", sql.Int, data.NEW_APPROVED_MAN_POWER ?? null);
    request.input("MAN_POWER_REQUEST_ID", sql.Int, data.MAN_POWER_REQUEST_ID ?? null);
    request.input("APPROVED_BY", sql.VarChar(50), data.APPROVED_BY || null);
    request.input("REMARKS", sql.VarChar(1000), data.REMARKS || null);
    request.input("STATUS_MASTER", sql.VarChar(20), normalizeStatus(data.STATUS_MASTER));
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

    const result = await request.execute("VMaster.SAVE_MAN_POWER_APPROVED_SETTINGS");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save man power approved settings");

    const newId = savedData ?? result.output?.MAN_POWER_APPROVED_ID;
    return { message: message || "Data saved successfully", MAN_POWER_APPROVED_ID: newId };
  } catch (error) {
    console.error("SAVE_MAN_POWER_APPROVED_SETTINGS SP error:", error);
    throw error;
  }
};

export const updateManPowerApprovedSettingsService = async (data: ManPowerApprovedSettingsData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const request = pool.request();
    request.input("MAN_POWER_APPROVED_ID", sql.Int, data.MAN_POWER_APPROVED_ID ?? 0);
    request.input("COMPANY_ID", sql.Int, data.COMPANY_ID ?? null);
    request.input("DEPARTMENT_ID", sql.Int, data.DEPARTMENT_ID ?? null);
    request.input("DESIGNATION_ID", sql.Int, data.DESIGNATION_ID ?? null);
    request.input("EMPLOYMENT_TYPE_ID", sql.Int, data.EMPLOYMENT_TYPE_ID ?? null);
    request.input("NEW_APPROVED_MAN_POWER", sql.Int, data.NEW_APPROVED_MAN_POWER ?? null);
    request.input("MAN_POWER_REQUEST_ID", sql.Int, data.MAN_POWER_REQUEST_ID ?? null);
    request.input("APPROVED_BY", sql.VarChar(50), data.APPROVED_BY || null);
    request.input("REMARKS", sql.VarChar(1000), data.REMARKS || null);
    request.input("STATUS_MASTER", sql.VarChar(20), normalizeStatus(data.STATUS_MASTER));
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

    const result = await request.execute("VMaster.UPDATE_MAN_POWER_APPROVED_SETTINGS");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update man power approved settings");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_MAN_POWER_APPROVED_SETTINGS SP error:", error);
    throw error;
  }
};

export const deleteManPowerApprovedSettingsService = async (
  id: number,
  user = "Admin",
  role = "Admin",
  macAddress = "WEB"
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("MAN_POWER_APPROVED_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_MAN_POWER_APPROVED_SETTINGS");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete man power approved settings");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_MAN_POWER_APPROVED_SETTINGS SP error:", error);
    throw error;
  }
};