import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface ClientAdditionalServicesMasterData {
  SERVICES_ID?: number;
  SERVICES_NAME: string;
  UOM?: string;
  UNIT_PRICE?: number;
  CURRENCY_ID?: number;
  SECTION_HEAD_RESPONSE_PERSON_EMP_ID?: number;
  SECTION_HEAD_RESPONSE_DATE?: Date | string;
  SECTION_HEAD_RESPONSE_STATUS?: string;
  SECTION_HEAD_RESPONSE_REMARKS?: string;
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

const numOrNull = (v: any): number | null =>
  v === undefined || v === null || v === "" ? null : Number(v);

const getStatus = (r: any) => r?.STATUS ?? r?.[""]?.[0] ?? "";
const getMessage = (r: any) => r?.MESSAGE ?? r?.[""]?.[1] ?? "";
const getData = (r: any) => r?.DATA ?? r?.[""]?.[2] ?? "";

const toDateTime = (value?: Date | string): Date | null => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

export const getAllClientAdditionalServicesMasterService = async (status = "ALL") => {
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
          .execute("VMaster.SHOW_CLIENT_ADDITIONAL_SERVICES_MASTER");
        allRows = allRows.concat(result.recordset || []);
      }
      return allRows.map(normalizeRow);
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(20), status)
      .execute("VMaster.SHOW_CLIENT_ADDITIONAL_SERVICES_MASTER");
    return (result.recordset || []).map(normalizeRow);
  } catch (error) {
    console.error("SHOW_CLIENT_ADDITIONAL_SERVICES_MASTER SP error:", error);
    throw error;
  }
};

export const getClientAdditionalServicesMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SERVICES_ID", sql.Int, id)
      .execute("VMaster.GET_CLIENT_ADDITIONAL_SERVICES_MASTER");

    const row = result.recordset[0] || null;
    return row ? normalizeRow(row) : null;
  } catch (error) {
    console.error("GET_CLIENT_ADDITIONAL_SERVICES_MASTER SP error:", error);
    throw error;
  }
};

export const saveClientAdditionalServicesMasterService = async (data: ClientAdditionalServicesMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SERVICES_ID", sql.Int, numOrNull(data.SERVICES_ID) ?? 0)
      .input("SERVICES_NAME", sql.VarChar(50), data.SERVICES_NAME || null)
      .input("UOM", sql.VarChar(20), data.UOM || null)
      .input("UNIT_PRICE", sql.Decimal(15, 2), numOrNull(data.UNIT_PRICE))
      .input("CURRENCY_ID", sql.Int, numOrNull(data.CURRENCY_ID) ?? 0)
      .input("SECTION_HEAD_RESPONSE_PERSON_EMP_ID", sql.Int, numOrNull(data.SECTION_HEAD_RESPONSE_PERSON_EMP_ID))
      .input("SECTION_HEAD_RESPONSE_DATE", sql.DateTime, toDateTime(data.SECTION_HEAD_RESPONSE_DATE))
      .input("SECTION_HEAD_RESPONSE_STATUS", sql.VarChar(50), data.SECTION_HEAD_RESPONSE_STATUS || null)
      .input("SECTION_HEAD_RESPONSE_REMARKS", sql.VarChar(50), data.SECTION_HEAD_RESPONSE_REMARKS || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_CLIENT_ADDITIONAL_SERVICES_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save client additional service");

    const dataValue = savedData;
    return {
      message: message || "Data saved successfully",
      SERVICES_ID: dataValue !== undefined && dataValue !== null && dataValue !== "" ? Number(dataValue) : undefined,
    };
  } catch (error) {
    console.error("SAVE_CLIENT_ADDITIONAL_SERVICES_MASTER SP error:", error);
    throw error;
  }
};

export const updateClientAdditionalServicesMasterService = async (data: ClientAdditionalServicesMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const existing = await getClientAdditionalServicesMasterByIdService(data.SERVICES_ID ?? 0);
    if (!existing) {
      throw new Error("RECORD DOES NOT EXIST");
    }

    const result = await pool
      .request()
      .input("SERVICES_ID", sql.Int, data.SERVICES_ID ?? 0)
      .input("SERVICES_NAME", sql.VarChar(50), data.SERVICES_NAME ?? null)
      .input("UOM", sql.VarChar(20), data.UOM ?? null)
      .input("UNIT_PRICE", sql.Decimal(15, 2), numOrNull(data.UNIT_PRICE))
      .input("CURRENCY_ID", sql.Int, numOrNull(data.CURRENCY_ID) ?? 0)
      .input("SECTION_HEAD_RESPONSE_PERSON_EMP_ID", sql.Int, numOrNull(data.SECTION_HEAD_RESPONSE_PERSON_EMP_ID))
      .input("SECTION_HEAD_RESPONSE_DATE", sql.DateTime, toDateTime(data.SECTION_HEAD_RESPONSE_DATE))
      .input("SECTION_HEAD_RESPONSE_STATUS", sql.VarChar(50), data.SECTION_HEAD_RESPONSE_STATUS ?? null)
      .input("SECTION_HEAD_RESPONSE_REMARKS", sql.VarChar(50), data.SECTION_HEAD_RESPONSE_REMARKS ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_CLIENT_ADDITIONAL_SERVICES_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update client additional service");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_CLIENT_ADDITIONAL_SERVICES_MASTER SP error:", error);
    throw error;
  }
};

export const deleteClientAdditionalServicesMasterService = async (
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
      .input("SERVICES_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_CLIENT_ADDITIONAL_SERVICES_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete client additional service");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_CLIENT_ADDITIONAL_SERVICES_MASTER SP error:", error);
    throw error;
  }
};