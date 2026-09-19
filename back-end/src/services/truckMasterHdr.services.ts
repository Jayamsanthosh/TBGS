import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface TruckMasterHdrData {
  TRUCK_ID?: number;
  TRUCK_NO?: string;
  TRUCK_TYPE_ID?: number;
  TRUCK_CHASSIS_NO?: string;
  TRAILER_ID?: number;
  TRAILER_TYPE_ID?: number;
  TRIP_INSIDE_OUTSIDE_STATUS?: string;
  DRIVER_EMP_ID?: number;
  DRIVER_NAME?: string;
  COMPANY_ID?: number;
  DEPARTMENT_ID?: number;
  DESIGNATION_ID?: number;
  DRIVER_PHONE_NO?: string;
  DRIVING_LICENSE_NO?: string;
  DRIVING_LICENSE_EXPIRY_DATE?: Date | string | null;
  TRUCK_COMPANY_ID?: number;
  IMPORTED_COUNTRY_ID?: number;
  PURCHASED_SUPPLIER_ID?: number;
  PURCHASE_DATE?: Date | string | null;
  FUEL_TYPE_ID?: number;
  TRUCK_CAPACITY?: number;
  TRUCK_CHASES_NO?: string;
  VEHICLE_CONTROL_NO?: string;
  ENGINE_NO?: string;
  ENGINE_CAPACITY?: number;
  NO_OF_AXLES?: number;
  AXLE_DISTANCE?: number;
  TITLE_HOLDER?: string;
  TITLE_HOLDER_TIN_NO?: string;
  TITLE_HOLDER_ADDRESS?: string;
  LATEST_INSURANCE_NO?: string;
  INSURANCE_AMOUNT?: number;
  MAKE?: string;
  MODEL?: string;
  MODEL_NO?: string;
  BODY_TYPE?: string;
  CLASS?: string;
  MANUFACTURE_YEAR?: string;
  SEATING_CAPACITY?: string;
  TARE_WEIGHT?: number;
  GROSS_WEIGHT?: number;
  FIXED_ROUTE?: string;
  TRUCK_STATUS?: string;
  TARGET_KM_TRUCK?: number;
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

const normalizeTruckRow = (r: any): any => ({
  ...r,
  INSURANCE_AMOUNT: r.INSURANCE_AMOUNT ?? r.insurance_Amount,
  TARGET_KM_TRUCK: r.TARGET_KM_TRUCK ?? r.Target_Km_Truck,
  GOODS_CAPACITY: r.GOODS_CAPACITY ?? r.Goods_Capacity,
});

const truckRequest = (pool: any, data: TruckMasterHdrData, includeId = true) => {
  const req = pool.request();
  if (includeId) {
    req.input("TRUCK_ID", sql.Int, toInt(data.TRUCK_ID));
  }
  req.input("TRUCK_NO", sql.VarChar(50), data.TRUCK_NO || null);
  req.input("TRUCK_TYPE_ID", sql.Int, toInt(data.TRUCK_TYPE_ID));
  req.input("TRUCK_CHASSIS_NO", sql.VarChar(50), data.TRUCK_CHASSIS_NO || null);
  req.input("TRAILER_ID", sql.Int, toInt(data.TRAILER_ID));
  req.input("TRAILER_TYPE_ID", sql.Int, toInt(data.TRAILER_TYPE_ID));
  req.input("TRIP_INSIDE_OUTSIDE_STATUS", sql.VarChar(50), data.TRIP_INSIDE_OUTSIDE_STATUS || null);
  req.input("DRIVER_EMP_ID", sql.Int, toInt(data.DRIVER_EMP_ID));
  req.input("DRIVER_NAME", sql.VarChar(100), data.DRIVER_NAME || null);
  req.input("COMPANY_ID", sql.Int, toInt(data.COMPANY_ID));
  req.input("DEPARTMENT_ID", sql.Int, toInt(data.DEPARTMENT_ID));
  req.input("DESIGNATION_ID", sql.Int, toInt(data.DESIGNATION_ID));
  req.input("DRIVER_PHONE_NO", sql.VarChar(50), data.DRIVER_PHONE_NO || null);
  req.input("DRIVING_LICENSE_NO", sql.VarChar(50), data.DRIVING_LICENSE_NO || null);
  req.input("DRIVING_LICENSE_EXPIRY_DATE", sql.DateTime, toDate(data.DRIVING_LICENSE_EXPIRY_DATE));
  req.input("TRUCK_COMPANY_ID", sql.Int, toInt(data.TRUCK_COMPANY_ID));
  req.input("IMPORTED_COUNTRY_ID", sql.Int, toInt(data.IMPORTED_COUNTRY_ID));
  req.input("PURCHASED_SUPPLIER_ID", sql.Int, toInt(data.PURCHASED_SUPPLIER_ID));
  req.input("PURCHASE_DATE", sql.DateTime, toDate(data.PURCHASE_DATE));
  req.input("FUEL_TYPE_ID", sql.Int, toInt(data.FUEL_TYPE_ID));
  req.input("TRUCK_CAPACITY", sql.Decimal(15, 2), toDecimal(data.TRUCK_CAPACITY));
  req.input("TRUCK_CHASES_NO", sql.VarChar(50), data.TRUCK_CHASES_NO || null);
  req.input("VEHICLE_CONTROL_NO", sql.VarChar(50), data.VEHICLE_CONTROL_NO || null);
  req.input("ENGINE_NO", sql.VarChar(50), data.ENGINE_NO || null);
  req.input("ENGINE_CAPACITY", sql.Int, toInt(data.ENGINE_CAPACITY));
  req.input("NO_OF_AXLES", sql.Int, toInt(data.NO_OF_AXLES));
  req.input("AXLE_DISTANCE", sql.Int, toInt(data.AXLE_DISTANCE));
  req.input("TITLE_HOLDER", sql.VarChar(50), data.TITLE_HOLDER || null);
  req.input("TITLE_HOLDER_TIN_NO", sql.VarChar(50), data.TITLE_HOLDER_TIN_NO || null);
  req.input("TITLE_HOLDER_ADDRESS", sql.VarChar(50), data.TITLE_HOLDER_ADDRESS || null);
  req.input("LATEST_INSURANCE_NO", sql.VarChar(50), data.LATEST_INSURANCE_NO || null);
  req.input("INSURANCE_AMOUNT", sql.Decimal(15, 2), toDecimal(data.INSURANCE_AMOUNT));
  req.input("MAKE", sql.VarChar(50), data.MAKE || null);
  req.input("MODEL", sql.VarChar(50), data.MODEL || null);
  req.input("MODEL_NO", sql.VarChar(50), data.MODEL_NO || null);
  req.input("BODY_TYPE", sql.VarChar(50), data.BODY_TYPE || null);
  req.input("CLASS", sql.VarChar(50), data.CLASS || null);
  req.input("MANUFACTURE_YEAR", sql.VarChar(50), data.MANUFACTURE_YEAR || null);
  req.input("SEATING_CAPACITY", sql.VarChar(50), data.SEATING_CAPACITY || null);
  req.input("TARE_WEIGHT", sql.Decimal(15, 2), toDecimal(data.TARE_WEIGHT));
  req.input("GROSS_WEIGHT", sql.Decimal(15, 2), toDecimal(data.GROSS_WEIGHT));
  req.input("FIXED_ROUTE", sql.VarChar(50), data.FIXED_ROUTE || null);
  req.input("TRUCK_STATUS", sql.VarChar(50), data.TRUCK_STATUS || null);
  req.input("TARGET_KM_TRUCK", sql.Int, toInt(data.TARGET_KM_TRUCK));
  req.input("GOODS_CAPACITY", sql.VarChar(50), data.GOODS_CAPACITY || null);
  req.input("REMARKS", sql.VarChar(1000), data.REMARKS || null);
  req.input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null);
  req.input("USER", sql.VarChar(50), data.USER || "Admin");
  req.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");
  return req;
};

export const getAllTruckMasterHdrService = async (status?: string) => {
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
          .execute("VMaster.SHOW_TRUCK_MASTER_hdr");
        allRows = allRows.concat(result.recordset || []);
      }
      return allRows.map(normalizeTruckRow);
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(50), status)
      .execute("VMaster.SHOW_TRUCK_MASTER_hdr");
    return (result.recordset || []).map(normalizeTruckRow);
  } catch (error) {
    console.error("SHOW_TRUCK_MASTER_hdr SP error:", error);
    throw error;
  }
};

export const getTruckMasterHdrByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("TRUCK_ID", sql.Int, id)
      .execute("VMaster.GET_TRUCK_MASTER_HDR");

    const row = result.recordset[0] || null;
    return row ? normalizeTruckRow(row) : null;
  } catch (error) {
    console.error("GET_TRUCK_MASTER_HDR SP error:", error);
    throw error;
  }
};

export const saveTruckMasterHdrService = async (data: TruckMasterHdrData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const request = truckRequest(pool, data, false);
    request.output("TRUCK_ID", sql.Int);
    const result = await request.execute("VMaster.SAVE_TRUCK_MASTER_HDR");

    const { status, message, data: id } = parseSprocResult(result.recordset?.[0], "Failed to save truck");

    const newId = id || result.output?.TRUCK_ID || Number(data.TRUCK_ID ?? 0);
    return { message: message || "Data saved successfully", TRUCK_ID: newId };
  } catch (error) {
    console.error("SAVE_TRUCK_MASTER_HDR SP error:", error);
    throw error;
  }
};

export const updateTruckMasterHdrService = async (data: TruckMasterHdrData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await truckRequest(pool, data).execute("VMaster.UPDATE_TRUCK_MASTER_HDR");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update truck");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_TRUCK_MASTER_HDR SP error:", error);
    throw error;
  }
};

export const deleteTruckMasterHdrService = async (
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
      .input("TRUCK_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_TRUCK_MASTER_HDR");

    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    const msg = (error as any)?.message || "";
    if (msg.includes("REFERENCE constraint") || msg.includes("FK_")) {
      throw new Error("Cannot delete: This truck has associated records.");
    }
    throw error;
  }
};
