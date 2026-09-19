import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface MassagerMasterData {
  MASSAGER_ID?: number;
  MASSAGER_NAME?: string;
  ADDRESS?: string;
  LOCATION_NAME?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const serializeRecordset = (rows: any[]) =>
  (rows || []).map((r: any) => ({ ...r, id: r.MASSAGER_ID }));

export const getAllMassagerMasterService = async (status?: string) => {
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
          .execute("VMaster.SHOW_MASSAGER_MASTER");
        allRows = allRows.concat(result.recordset || []);
      }
      return serializeRecordset(allRows);
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(50), status)
      .execute("VMaster.SHOW_MASSAGER_MASTER");
    return serializeRecordset(result.recordset || []);
  } catch (error) {
    console.error("SHOW_MASSAGER_MASTER SP error:", error);
    throw error;
  }
};

export const getMassagerMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("MASSAGER_ID", sql.Int, id)
      .execute("VMaster.GET_MASSAGER_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_MASSAGER_MASTER SP error:", error);
    throw error;
  }
};

export const saveMassagerMasterService = async (data: MassagerMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const request = pool.request();
    request.output("MASSAGER_ID", sql.Int);
    request.input("MASSAGER_NAME", sql.VarChar(50), data.MASSAGER_NAME || null);
    request.input("ADDRESS", sql.VarChar(50), data.ADDRESS || null);
    request.input("LOCATION_NAME", sql.VarChar(50), data.LOCATION_NAME || null);
    request.input("REMARKS", sql.VarChar(1000), data.REMARKS || null);
    request.input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null);
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

    const result = await request.execute("VMaster.SAVE_MASSAGER_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save massager");

    const newId = savedData ?? result.output?.MASSAGER_ID;
    return { message: message || "Data saved successfully", MASSAGER_ID: newId };
  } catch (error) {
    console.error("SAVE_MASSAGER_MASTER SP error:", error);
    throw error;
  }
};

export const updateMassagerMasterService = async (data: MassagerMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("MASSAGER_ID", sql.Int, data.MASSAGER_ID ?? 0)
      .input("MASSAGER_NAME", sql.VarChar(50), data.MASSAGER_NAME ?? null)
      .input("ADDRESS", sql.VarChar(50), data.ADDRESS ?? null)
      .input("LOCATION_NAME", sql.VarChar(50), data.LOCATION_NAME ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_MASSAGER_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update massager");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_MASSAGER_MASTER SP error:", error);
    throw error;
  }
};

export const deleteMassagerMasterService = async (
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
      .input("MASSAGER_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_MASSAGER_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete massager");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    const msg = (error as any)?.message || "";
    if (msg.includes("REFERENCE constraint") || msg.includes("FK_")) {
      throw new Error("Cannot delete: This massager has associated records.");
    }
    throw error;
  }
};