import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface AnimalMasterData {
  ANIMAL_ID?: number;
  ANIMAL_NAME: string;
  ADDRESS?: string;
  EXCHANGE_RATE?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
  ANIMAL_CATEGORY_ID?: number;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllAnimalMasterService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .execute("VMaster.SHOW_ANIMAL_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_ANIMAL_MASTER SP error:", error);
    throw error;
  }
};

export const getAnimalMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("ANIMAL_ID", sql.Int, id)
      .execute("VMaster.GET_ANIMAL_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_ANIMAL_MASTER SP error:", error);
    throw error;
  }
};

export const saveAnimalMasterService = async (data: AnimalMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("ANIMAL_ID", sql.Int, data.ANIMAL_ID ?? 0)
      .input("ANIMAL_NAME", sql.VarChar(50), data.ANIMAL_NAME || null)
      .input("ADDRESS", sql.VarChar(50), data.ADDRESS || null)
      .input("EXCHANGE_RATE", sql.Decimal(15, 5), data.EXCHANGE_RATE ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("ANIMAL_CATEGORY_ID", sql.Int, data.ANIMAL_CATEGORY_ID ?? null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_ANIMAL_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save animal");

    return { message: message || "Animal saved successfully", ANIMAL_ID: savedData };
  } catch (error) {
    console.error("SAVE_ANIMAL_MASTER SP error:", error);
    throw error;
  }
};

export const updateAnimalMasterService = async (data: AnimalMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("ANIMAL_ID", sql.Int, data.ANIMAL_ID ?? 0)
      .input("ANIMAL_NAME", sql.VarChar(50), data.ANIMAL_NAME ?? null)
      .input("ADDRESS", sql.VarChar(50), data.ADDRESS ?? null)
      .input("EXCHANGE_RATE", sql.Decimal(15, 5), data.EXCHANGE_RATE ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("ANIMAL_CATEGORY_ID", sql.Int, data.ANIMAL_CATEGORY_ID ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_ANIMAL_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update animal");

    return { message: message || "Animal updated successfully" };
  } catch (error) {
    console.error("UPDATE_ANIMAL_MASTER SP error:", error);
    throw error;
  }
};

export const deleteAnimalMasterService = async (
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
      .input("ANIMAL_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_ANIMAL_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete animal");

    return { message: message || "Animal deleted successfully" };
  } catch (error) {
    console.error("DELETE_ANIMAL_MASTER SP error:", error);
    throw error;
  }
};