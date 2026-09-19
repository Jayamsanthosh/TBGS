import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface TrailerMasterData {
  TRAILER_ID?: number;
  TRAILER_NO?: string;
  TRAILER_TYPE_ID?: number;
  TRAILER_CHASSIS_NO?: string;
  TRAILER_DESCRIPTION?: string;
  VEHICLE_CONTROL_NO?: string;
  TRAILER_OWNED_COMPANY_ID?: number;
  TITLE_HOLDER?: string;
  TITLE_HOLDER_TIN_NO?: string;
  TITLE_HOLDER_ADDRESS?: string;
  MAKE?: string;
  MODEL?: string;
  MODEL_NO?: string;
  BODY_TYPE?: string;
  CLASS?: string;
  MANUFACTURE_YEAR?: number;
  TARE_WEIGHT?: number;
  GROSS_WEIGHT?: number;
  IMPORTED_COUNTRY_ID?: number;
  IMPORTED_SUPPLIER_ID?: number;
  PURCHASE_DATE?: Date | string | null;
  LATEST_INSURANCE_NO?: string;
  INSURANCE_AMOUNT?: number;
  GOODS_CAPACITY?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const toInt = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

const toDecimal = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

const toDate = (v: any): Date | null => {
  if (v === undefined || v === null || v === "") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const trailerRequest = (pool: any, data: TrailerMasterData) => {
  const req = pool.request();
  req.input("TRAILER_ID", sql.Int, toInt(data.TRAILER_ID));
  req.input("TRAILER_NO", sql.VarChar(50), data.TRAILER_NO || null);
  req.input("TRAILER_TYPE_ID", sql.Int, toInt(data.TRAILER_TYPE_ID));
  req.input("TRAILER_CHASSIS_NO", sql.VarChar(100), data.TRAILER_CHASSIS_NO || null);
  req.input("TRAILER_DESCRIPTION", sql.VarChar(100), data.TRAILER_DESCRIPTION || null);
  req.input("VEHICLE_CONTROL_NO", sql.VarChar(50), data.VEHICLE_CONTROL_NO || null);
  req.input("TRAILER_OWNED_COMPANY_ID", sql.Int, toInt(data.TRAILER_OWNED_COMPANY_ID));
  req.input("TITLE_HOLDER", sql.VarChar(50), data.TITLE_HOLDER || null);
  req.input("TITLE_HOLDER_TIN_NO", sql.VarChar(50), data.TITLE_HOLDER_TIN_NO || null);
  req.input("TITLE_HOLDER_ADDRESS", sql.VarChar(50), data.TITLE_HOLDER_ADDRESS || null);
  req.input("MAKE", sql.VarChar(50), data.MAKE || null);
  req.input("MODEL", sql.VarChar(50), data.MODEL || null);
  req.input("MODEL_NO", sql.VarChar(50), data.MODEL_NO || null);
  req.input("BODY_TYPE", sql.VarChar(50), data.BODY_TYPE || null);
  req.input("CLASS", sql.VarChar(50), data.CLASS || null);
  req.input("MANUFACTURE_YEAR", sql.Int, toInt(data.MANUFACTURE_YEAR));
  req.input("TARE_WEIGHT", sql.Decimal(15, 2), toDecimal(data.TARE_WEIGHT));
  req.input("GROSS_WEIGHT", sql.Decimal(15, 2), toDecimal(data.GROSS_WEIGHT));
  req.input("IMPORTED_COUNTRY_ID", sql.Int, toInt(data.IMPORTED_COUNTRY_ID));
  req.input("IMPORTED_SUPPLIER_ID", sql.Int, toInt(data.IMPORTED_SUPPLIER_ID));
  req.input("PURCHASE_DATE", sql.DateTime, toDate(data.PURCHASE_DATE));
  req.input("LATEST_INSURANCE_NO", sql.VarChar(50), data.LATEST_INSURANCE_NO || null);
  req.input("INSURANCE_AMOUNT", sql.Decimal(15, 2), toDecimal(data.INSURANCE_AMOUNT));
  req.input("GOODS_CAPACITY", sql.VarChar(80), data.GOODS_CAPACITY || null);
  req.input("REMARKS", sql.VarChar(1000), data.REMARKS || null);
  req.input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null);
  req.input("USER", sql.VarChar(50), data.USER || "Admin");
  req.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");
  return req;
};

export const getAllTrailerMasterService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .execute("VMaster.SHOW_TRAILER_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_TRAILER_MASTER SP error:", error);
    throw error;
  }
};

export const getTrailerMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("TRAILER_ID", sql.Int, id)
      .execute("VMaster.GET_TRAILER_MASTER");
    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_TRAILER_MASTER SP error:", error);
    throw error;
  }
};

export const saveTrailerMasterService = async (data: TrailerMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await trailerRequest(pool, data).execute("VMaster.SAVE_TRAILER_MASTER");
    const { status, message, data: id } = parseSprocResult(result.recordset?.[0], "Failed to save trailer");
    return { message: message || "Trailer saved successfully", TRAILER_ID: id || Number(data.TRAILER_ID ?? 0) };
  } catch (error) {
    console.error("SAVE_TRAILER_MASTER SP error:", error);
    throw error;
  }
};

export const updateTrailerMasterService = async (data: TrailerMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await trailerRequest(pool, data).execute("VMaster.UPDATE_TRAILER_MASTER");
    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update trailer");
    return { message: message || "Trailer updated successfully" };
  } catch (error) {
    console.error("UPDATE_TRAILER_MASTER SP error:", error);
    throw error;
  }
};

export const deleteTrailerMasterService = async (
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
      .input("TRAILER_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_TRAILER_MASTER");
    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete");
    return { message: message || "Trailer deleted successfully" };
  } catch (error) {
    console.error("DELETE_TRAILER_MASTER SP error:", error);
    throw error;
  }
};
