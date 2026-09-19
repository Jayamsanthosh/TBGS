import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface CountryMasterData {
  Country_Id?: number;
  Country_Name: string;
  nicename: string;
  iso3: string;
  numcode: number;
  phonecode: number;
  Batch_No: string;
  Remarks: string;
  Status_Master: string;
  User?: string;
  Mac_Address?: string;
  ROLE?: string;
}

export const getAllCountryMasterService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .execute("VMaster.SHOW_COUNTRY_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_COUNTRY_MASTER SP error:", error);
    throw error;
  }
};

export const getCountryMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("Country_Id", sql.Int, id)
      .execute("VMaster.GET_COUNTRY_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_COUNTRY_MASTER SP error:", error);
    throw error;
  }
};

export const saveCountryMasterService = async (data: CountryMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("Country_Id", sql.Int, data.Country_Id ?? 0)
      .input("Country_Name", sql.VarChar(100), data.Country_Name || null)
      .input("nicename", sql.VarChar(80), data.nicename || null)
      .input("iso3", sql.VarChar(50), data.iso3 || null)
      .input("numcode", sql.Int, data.numcode ?? 0)
      .input("phonecode", sql.Int, data.phonecode ?? 0)
      .input("Batch_No", sql.VarChar(2), data.Batch_No || null)
      .input("Remarks", sql.VarChar(1000), data.Remarks || null)
      .input("Status_Master", sql.VarChar(50), data.Status_Master || null)
      .input("User", sql.VarChar(50), data.User || "Admin")
      .input("Mac_Address", sql.VarChar(50), data.Mac_Address || "WEB")
      .execute("VMaster.SAVE_COUNTRY_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to save country");

    return { message: message || "Country saved successfully" };
  } catch (error) {
    console.error("SAVE_COUNTRY_MASTER SP error:", error);
    throw error;
  }
};

export const updateCountryMasterService = async (data: CountryMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("Country_Id", sql.Int, data.Country_Id ?? 0)
      .input("Country_Name", sql.VarChar(100), data.Country_Name ?? null)
      .input("nicename", sql.VarChar(80), data.nicename ?? null)
      .input("iso3", sql.VarChar(50), data.iso3 ?? null)
      .input("numcode", sql.Int, data.numcode ?? 0)
      .input("phonecode", sql.Int, data.phonecode ?? 0)
      .input("Batch_No", sql.VarChar(2), data.Batch_No ?? null)
      .input("Remarks", sql.VarChar(1000), data.Remarks ?? null)
      .input("Status_Master", sql.VarChar(50), data.Status_Master ?? null)
      .input("User", sql.VarChar(50), data.User ?? "Admin")
      .input("Mac_Address", sql.VarChar(50), data.Mac_Address ?? "WEB")
      .execute("VMaster.UPDATE_COUNTRY_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update country");

    return { message: message || "Country updated successfully" };
  } catch (error) {
    console.error("UPDATE_COUNTRY_MASTER SP error:", error);
    throw error;
  }
};

export const deleteCountryMasterService = async (
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
      .input("Country_Id", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_COUNTRY_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete country");

    return { message: message || "Country deleted successfully" };
  } catch (error) {
    console.error("DELETE_COUNTRY_MASTER SP error:", error);
    throw error;
  }
};
