import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface DesignationGroupMasterData {
  DESIGNATION_GROUP_ID?: number;
  DESIGNATION_GROUP_NAME?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const serializeRecordset = (rows: any[]) =>
  (rows || []).map((r: any) => ({ ...r, id: r.DESIGNATION_GROUP_ID }));

export const getAllDesignationGroupMasterService = async (status?: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    if (status === "ALL" || !status) {
      const statuses = ["AC", "IA"];
      let allRows: any[] = [];
      for (const s of statuses) {
        const result = await pool
          .request()
          .input("STATUS", sql.VarChar(20), s)
          .execute("VMaster.SHOW_DESIGNATION_GROUP_MASTER");
        allRows = allRows.concat(result.recordset || []);
      }
      return serializeRecordset(allRows);
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(20), status)
      .execute("VMaster.SHOW_DESIGNATION_GROUP_MASTER");
    return serializeRecordset(result.recordset || []);
  } catch (error) {
    console.error("SHOW_DESIGNATION_GROUP_MASTER SP error:", error);
    throw error;
  }
};

export const getDesignationGroupMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("DESIGNATION_GROUP_ID", sql.Int, id)
      .execute("VMaster.GET_DESIGNATION_GROUP_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_DESIGNATION_GROUP_MASTER SP error:", error);
    throw error;
  }
};

export const saveDesignationGroupMasterService = async (data: DesignationGroupMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("DESIGNATION_GROUP_NAME", sql.VarChar(50), data.DESIGNATION_GROUP_NAME || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_DESIGNATION_GROUP_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save designation group");

    return { message: message || "Data saved successfully", DESIGNATION_GROUP_ID: savedData };
  } catch (error) {
    console.error("SAVE_DESIGNATION_GROUP_MASTER SP error:", error);
    throw error;
  }
};

export const updateDesignationGroupMasterService = async (data: DesignationGroupMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("DESIGNATION_GROUP_ID", sql.Int, data.DESIGNATION_GROUP_ID ?? 0)
      .input("DESIGNATION_GROUP_NAME", sql.VarChar(50), data.DESIGNATION_GROUP_NAME ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_DESIGNATION_GROUP_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update designation group");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_DESIGNATION_GROUP_MASTER SP error:", error);
    throw error;
  }
};

export const deleteDesignationGroupMasterService = async (
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
      .input("DESIGNATION_GROUP_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_DESIGNATION_GROUP_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete designation group");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    const msg = (error as any)?.message || "";
    if (msg.includes("REFERENCE constraint") || msg.includes("FK_")) {
      throw new Error("Cannot delete: This designation group has associated records.");
    }
    throw error;
  }
};