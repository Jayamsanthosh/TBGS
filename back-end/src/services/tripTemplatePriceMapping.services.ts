import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface TripTemplatePriceMappingData {
  PRICE_ID?: number;
  TRIP_TEMPLATE_ID?: number;
  DISTANCE_KM?: number;
  COMPANY_ID?: number;
  TRUCK_TYPE_ID?: number;
  TRIP_AMOUNT?: number;
  CURRENCY_ID?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const numOrNull = (v: any): number | null =>
  v === undefined || v === null || v === "" ? null : Number(v);

export const getAllTripTemplatePriceMappingService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .execute("VMaster.SHOW_TRIP_TEMPLATE_PRICE_MAPPING");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_TRIP_TEMPLATE_PRICE_MAPPING SP error:", error);
    throw error;
  }
};

export const saveTripTemplatePriceMappingService = async (data: TripTemplatePriceMappingData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .output("PRICE_ID", sql.Int)
      .input("TRIP_TEMPLATE_ID", sql.Int, numOrNull(data.TRIP_TEMPLATE_ID) ?? 0)
      .input("DISTANCE_KM", sql.Decimal(15, 2), numOrNull(data.DISTANCE_KM))
      .input("COMPANY_ID", sql.Int, numOrNull(data.COMPANY_ID) ?? 0)
      .input("TRUCK_TYPE_ID", sql.Int, numOrNull(data.TRUCK_TYPE_ID) ?? 0)
      .input("TRIP_AMOUNT", sql.Decimal(15, 2), numOrNull(data.TRIP_AMOUNT))
      .input("CURRENCY_ID", sql.Int, numOrNull(data.CURRENCY_ID) ?? 0)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_TRIP_TEMPLATE_PRICE_MAPPING");

    const { status, message, data: id } = parseSprocResult(result.recordset?.[0], "Failed to save trip template price mapping");

    const newId = result.output?.PRICE_ID ?? id;
    return { message: message || "Data saved successfully", PRICE_ID: newId };
  } catch (error) {
    console.error("SAVE_TRIP_TEMPLATE_PRICE_MAPPING SP error:", error);
    throw error;
  }
};

export const updateTripTemplatePriceMappingService = async (data: TripTemplatePriceMappingData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .output("PRICE_ID", sql.Int, numOrNull(data.PRICE_ID) ?? 0)
      .input("TRIP_TEMPLATE_ID", sql.Int, numOrNull(data.TRIP_TEMPLATE_ID) ?? 0)
      .input("DISTANCE_KM", sql.Decimal(15, 2), numOrNull(data.DISTANCE_KM))
      .input("COMPANY_ID", sql.Int, numOrNull(data.COMPANY_ID) ?? 0)
      .input("TRUCK_TYPE_ID", sql.Int, numOrNull(data.TRUCK_TYPE_ID) ?? 0)
      .input("TRIP_AMOUNT", sql.Decimal(15, 2), numOrNull(data.TRIP_AMOUNT))
      .input("CURRENCY_ID", sql.Int, numOrNull(data.CURRENCY_ID) ?? 0)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.UPDATE_TRIP_TEMPLATE_PRICE_MAPPING");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update trip template price mapping");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_TRIP_TEMPLATE_PRICE_MAPPING SP error:", error);
    throw error;
  }
};

export const deleteTripTemplatePriceMappingService = async (
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
      .input("PRICE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user)
      .input("ROLE", sql.VarChar(50), role)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VMaster.DELETE_TRIP_TEMPLATE_PRICE_MAPPING");

    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete trip template price mapping");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_TRIP_TEMPLATE_PRICE_MAPPING SP error:", error);
    throw error;
  }
};
