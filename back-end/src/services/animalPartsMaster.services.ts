import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface AnimalPartsMasterData {
  ANIMAL_PARTS_ID?: number;
  ANIMAL_PARTS_NAME?: string;
  ANIMAL_PARTS_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const serializeRecordset = (rows: any[]) =>
  (rows || []).map((r: any) => ({ ...r, id: r.ANIMAL_PARTS_ID }));

export const getAllAnimalPartsMasterService = async (status?: string) => {
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
          .execute("VMaster.SHOW_ANIMAL_PARTS_MASTER");
        allRows = allRows.concat(result.recordset || []);
      }
      return serializeRecordset(allRows);
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(20), status)
      .execute("VMaster.SHOW_ANIMAL_PARTS_MASTER");
    return serializeRecordset(result.recordset || []);
  } catch (error) {
    console.error("SHOW_ANIMAL_PARTS_MASTER SP error:", error);
    throw error;
  }
};

export const getAnimalPartsMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("ANIMAL_PARTS_ID", sql.Int, id)
      .execute("VMaster.GET_ANIMAL_PARTS_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_ANIMAL_PARTS_MASTER SP error:", error);
    throw error;
  }
};

export const saveAnimalPartsMasterService = async (data: AnimalPartsMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("ANIMAL_PARTS_NAME", sql.VarChar(50), data.ANIMAL_PARTS_NAME || null)
      .input("ANIMAL_PARTS_DESCRIPTION", sql.VarChar(50), data.ANIMAL_PARTS_DESCRIPTION || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_ANIMAL_PARTS_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save animal parts");

    return { message: message || "Data saved successfully", ANIMAL_PARTS_ID: savedData };
  } catch (error) {
    console.error("SAVE_ANIMAL_PARTS_MASTER SP error:", error);
    throw error;
  }
};

export const updateAnimalPartsMasterService = async (data: AnimalPartsMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("ANIMAL_PARTS_ID", sql.Int, data.ANIMAL_PARTS_ID ?? 0)
      .input("ANIMAL_PARTS_NAME", sql.VarChar(50), data.ANIMAL_PARTS_NAME ?? null)
      .input("ANIMAL_PARTS_DESCRIPTION", sql.VarChar(50), data.ANIMAL_PARTS_DESCRIPTION ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_ANIMAL_PARTS_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update animal parts");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_ANIMAL_PARTS_MASTER SP error:", error);
    throw error;
  }
};

export const deleteAnimalPartsMasterService = async (
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
      .input("ANIMAL_PARTS_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_ANIMAL_PARTS_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete animal parts");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    throw error;
  }
};