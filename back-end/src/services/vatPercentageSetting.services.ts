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

export interface VatPercentageSettingData {
  SNO?: number;
  VAT_PERCENTAGE: number;
  EFFECTIVE_FROM?: string;
  EFFECTIVE_TO?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
}

export const getAllVatPercentageSettingService = async (status = 'AC') => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("status", sql.VarChar(10), status)
      .execute("VMASTER.SHOW_VAT_PERCENTAGE_SETTING");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_VAT_PERCENTAGE_SETTING SP error:", error);
    throw error;
  }
};

export const getVatPercentageSettingByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, id)
      .execute("VMaster.GET_VAT_PERCENTAGE_SETTING");
    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_VAT_PERCENTAGE_SETTING SP error:", error);
    throw error;
  }
};

export const saveVatPercentageSettingService = async (data: VatPercentageSettingData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, data.SNO ?? 0)
      .input("VAT_PERCENTAGE", sql.Decimal(15, 2), data.VAT_PERCENTAGE ?? 0)
      .input("EFFECTIVE_FROM", sql.DateTime, data.EFFECTIVE_FROM || null)
      .input("EFFECTIVE_TO", sql.DateTime, data.EFFECTIVE_TO || null)
      .input("REMARKS", sql.VarChar(2000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), normalizeStatus(data.STATUS_MASTER))
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_VAT_PERCENTAGE_SETTING");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save VAT percentage");

    return { message: message || "Data saved successfully", SNO: savedData };
  } catch (error) {
    console.error("SAVE_VAT_PERCENTAGE_SETTING SP error:", error);
    throw error;
  }
};

export const updateVatPercentageSettingService = async (data: VatPercentageSettingData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, data.SNO ?? 0)
      .input("VAT_PERCENTAGE", sql.Decimal(15, 2), data.VAT_PERCENTAGE ?? 0)
      .input("EFFECTIVE_FROM", sql.DateTime, data.EFFECTIVE_FROM || null)
      .input("EFFECTIVE_TO", sql.DateTime, data.EFFECTIVE_TO || null)
      .input("REMARKS", sql.VarChar(2000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), normalizeStatus(data.STATUS_MASTER))
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.UPDATE_VAT_PERCENTAGE_SETTING");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to update VAT percentage");

    return { message: message || "Record updated successfully", SNO: savedData };
  } catch (error) {
    console.error("UPDATE_VAT_PERCENTAGE_SETTING SP error:", error);
    throw error;
  }
};

export const deleteVatPercentageSettingService = async (id: number, user = "Admin", role = "Admin", macAddress = "WEB") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, id)
      .input("USER", sql.VarChar(50), user)
      .input("ROLE", sql.VarChar(50), role)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VMaster.DELETE_VAT_PERCENTAGE_SETTING");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete VAT percentage");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_VAT_PERCENTAGE_SETTING SP error:", error);
    throw error;
  }
};