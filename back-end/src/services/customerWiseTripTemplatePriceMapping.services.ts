import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface CustomerWiseTripTemplatePriceMappingData {
  PRICE_CUSTOMER_ID?: number;
  COMPANY_ID?: number;
  BP_ID?: number;
  TRIP_TEMPLATE_ID?: number;
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

export const getAllCustomerWiseTripTemplatePriceMappingService = async (status?: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(50), status || "AC")
      .execute("VMaster.SHOW_CUSTOMER_WISE_TRIP_TEMPLATE_PRICE_MAPPING");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_CUSTOMER_WISE_TRIP_TEMPLATE_PRICE_MAPPING SP error:", error);
    throw error;
  }
};

export const saveCustomerWiseTripTemplatePriceMappingService = async (data: CustomerWiseTripTemplatePriceMappingData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .output("PRICE_CUSTOMER_ID", sql.Int)
      .input("COMPANY_ID", sql.Int, numOrNull(data.COMPANY_ID) ?? 0)
      .input("BP_ID", sql.Int, numOrNull(data.BP_ID) ?? 0)
      .input("TRIP_TEMPLATE_ID", sql.Int, numOrNull(data.TRIP_TEMPLATE_ID) ?? 0)
      .input("TRUCK_TYPE_ID", sql.Int, numOrNull(data.TRUCK_TYPE_ID) ?? 0)
      .input("TRIP_AMOUNT", sql.Decimal(15, 2), numOrNull(data.TRIP_AMOUNT))
      .input("CURRENCY_ID", sql.Int, numOrNull(data.CURRENCY_ID) ?? 0)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_CUSTOMER_WISE_TRIP_TEMPLATE_PRICE_MAPPING");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save customer wise trip template price mapping");

    const newId = result.output?.PRICE_CUSTOMER_ID ?? savedData;
    return { message: message || "Data saved successfully", PRICE_CUSTOMER_ID: newId };
  } catch (error) {
    console.error("SAVE_CUSTOMER_WISE_TRIP_TEMPLATE_PRICE_MAPPING SP error:", error);
    throw error;
  }
};

export const updateCustomerWiseTripTemplatePriceMappingService = async (data: CustomerWiseTripTemplatePriceMappingData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .output("PRICE_CUSTOMER_ID", sql.Int, numOrNull(data.PRICE_CUSTOMER_ID) ?? 0)
      .input("COMPANY_ID", sql.Int, numOrNull(data.COMPANY_ID) ?? 0)
      .input("BP_ID", sql.Int, numOrNull(data.BP_ID) ?? 0)
      .input("TRIP_TEMPLATE_ID", sql.Int, numOrNull(data.TRIP_TEMPLATE_ID) ?? 0)
      .input("TRUCK_TYPE_ID", sql.Int, numOrNull(data.TRUCK_TYPE_ID) ?? 0)
      .input("TRIP_AMOUNT", sql.Decimal(15, 2), numOrNull(data.TRIP_AMOUNT))
      .input("CURRENCY_ID", sql.Int, numOrNull(data.CURRENCY_ID) ?? 0)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.UPDATE_CUSTOMER_WISE_TRIP_TEMPLATE_PRICE_MAPPING");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update customer wise trip template price mapping");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_CUSTOMER_WISE_TRIP_TEMPLATE_PRICE_MAPPING SP error:", error);
    throw error;
  }
};

export const deleteCustomerWiseTripTemplatePriceMappingService = async (
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
      .input("PRICE_CUSTOMER_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user)
      .input("ROLE", sql.VarChar(50), role)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VMaster.DELETE_CUSTOMER_WISE_TRIP_TEMPLATE_PRICE_MAPPING");

    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete customer wise trip template price mapping");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_CUSTOMER_WISE_TRIP_TEMPLATE_PRICE_MAPPING SP error:", error);
    throw error;
  }
};