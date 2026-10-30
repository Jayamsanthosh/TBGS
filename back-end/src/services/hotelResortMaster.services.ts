import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

const normalizeStatus = (status: string | undefined | null): string => {
  if (!status) return 'AC';
  const s = status.trim().toUpperCase();
  if (s === 'ACTIVE' || s === 'AC') return 'AC';
  if (s === 'INACTIVE' || s === 'IN') return 'IN';
  return s.substring(0, 2);
};

export interface HotelResortMasterData {
  HOTEL_ID?: number;
  HOTEL_TYPE?: string;
  HOTEL_NAME: string;
  HOTEL_STAR?: string;
  COUNTRY_ID?: number;
  REGION_ID?: number;
  DISTRICT_ID?: number;
  LOCATION_NAME?: string;
  HOTEL_ADDRESS?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  LINK_ID?: number | null;
}

export const getAllHotelResortMasterService = async (status = 'AC') => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("status", sql.VarChar(10), status)
      .execute("VMASTER.SHOW_HOTEL_RESORT_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_HOTEL_RESORT_MASTER SP error:", error);
    throw error;
  }
};

export const getHotelResortMasterByIdService = async (id: number, linkId: number | null = null) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("HOTEL_ID", sql.Int, id)
      .input("LINK_ID", sql.Int, linkId ?? 0)
      .execute("VMaster.GET_HOTEL_RESORT_MASTER");
    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_HOTEL_RESORT_MASTER SP error:", error);
    throw error;
  }
};

export const saveHotelResortMasterService = async (data: HotelResortMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("HOTEL_ID", sql.Int, data.HOTEL_ID ?? 0)
      .input("HOTEL_TYPE", sql.VarChar(50), data.HOTEL_TYPE || null)
      .input("HOTEL_NAME", sql.VarChar(10), data.HOTEL_NAME || null)
      .input("HOTEL_STAR", sql.VarChar(20), data.HOTEL_STAR || null)
      .input("COUNTRY_ID", sql.Int, data.COUNTRY_ID ?? null)
      .input("REGION_ID", sql.Int, data.REGION_ID ?? null)
      .input("DISTRICT_ID", sql.Int, data.DISTRICT_ID ?? null)
      .input("LOCATION_NAME", sql.VarChar(50), data.LOCATION_NAME || null)
      .input("HOTEL_ADDRESS", sql.VarChar(150), data.HOTEL_ADDRESS || null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), normalizeStatus(data.STATUS_MASTER))
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .input("LINK_ID", sql.Int, data.LINK_ID ?? 0)
      .execute("VMaster.SAVE_HOTEL_RESORT_MASTER");

    const { message, data: savedId } = parseSprocResult(result.recordset?.[0], "Failed to save hotel");

    return {
      message: message || "Data saved successfully",
      HOTEL_ID: savedId !== undefined && savedId !== null && savedId !== "" ? Number(savedId) : undefined,
    };
  } catch (error) {
    console.error("SAVE_HOTEL_RESORT_MASTER SP error:", error);
    throw error;
  }
};

export const updateHotelResortMasterService = async (data: HotelResortMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("HOTEL_ID", sql.Int, data.HOTEL_ID ?? 0)
      .input("HOTEL_TYPE", sql.VarChar(50), data.HOTEL_TYPE || null)
      .input("HOTEL_NAME", sql.VarChar(10), data.HOTEL_NAME || null)
      .input("HOTEL_STAR", sql.VarChar(20), data.HOTEL_STAR || null)
      .input("COUNTRY_ID", sql.Int, data.COUNTRY_ID ?? null)
      .input("REGION_ID", sql.Int, data.REGION_ID ?? null)
      .input("DISTRICT_ID", sql.Int, data.DISTRICT_ID ?? null)
      .input("LOCATION_NAME", sql.VarChar(50), data.LOCATION_NAME || null)
      .input("HOTEL_ADDRESS", sql.VarChar(150), data.HOTEL_ADDRESS || null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), normalizeStatus(data.STATUS_MASTER))
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .input("LINK_ID", sql.Int, data.LINK_ID ?? 0)
      .execute("VMaster.UPDATE_HOTEL_RESORT_MASTER");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to update hotel");

    return { message: message || "Record updated successfully", HOTEL_ID: data.HOTEL_ID };
  } catch (error) {
    console.error("UPDATE_HOTEL_RESORT_MASTER SP error:", error);
    throw error;
  }
};

export const deleteHotelResortMasterService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("HOTEL_ID", sql.Int, id)
      .execute("VMaster.DELETE_HOTEL_RESORT_MASTER");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to delete hotel");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_HOTEL_RESORT_MASTER SP error:", error);
    const msg = ((error as any)?.message as string) || "";
    if (msg.includes("REFERENCE constraint") || msg.includes("FK_")) {
      const conflict = new Error("Cannot delete: This hotel has associated records.") as Error & { httpStatus?: number };
      conflict.httpStatus = 409;
      throw conflict;
    }
    throw error;
  }
};