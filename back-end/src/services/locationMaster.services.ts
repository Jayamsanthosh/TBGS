import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface LocationMasterData {
  LOCATION_ID?: number;
  LOCATION_NAME?: string;
  COUNTRY_ID?: number;
  REGION_ID?: number;
  DISTRICT_ID?: number;
  CAMP_ID?: number;
  STORE_ID?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
  LINK_ID?: number | null;
}

const toInt = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

export const getAllLocationMasterService = async (status?: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool.request().input("STATUS", sql.VarChar(20), status || "Active")
      .query(`SELECT
        L.LOCATION_ID,
        L.LOCATION_NAME,
        C.Country_Name,
        R.REGION_NAME,
        D.District_Name,
        CM.CAMP_NAME,
        S.STORE_NAME,
        L.REMARKS,
        L.STATUS_MASTER AS STATUS,
        L.COUNTRY_ID,
        L.REGION_ID,
        L.DISTRICT_ID,
        L.CAMP_ID,
        L.STORE_ID
    FROM VMaster.TBL_LOCATION_MASTER L
    LEFT JOIN VMaster.TBL_COUNTRY_MASTER C ON L.COUNTRY_ID = C.COUNTRY_ID
    LEFT JOIN VMaster.TBL_REGION_MASTER R ON L.REGION_ID = R.REGION_ID
    LEFT JOIN VMaster.TBL_DISTRICT_MASTER D ON L.DISTRICT_ID = D.District_id
    LEFT JOIN VMaster.TBL_CAMP_MASTER CM ON L.CAMP_ID = CM.CAMP_ID
    LEFT JOIN VMaster.TBL_STORE_MASTER S ON L.STORE_ID = S.Store_Id
    WHERE L.STATUS_MASTER = @STATUS`);
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_LOCATION_MASTER SP error:", error);
    throw error;
  }
};

export const getLocationMasterByIdService = async (id: number, linkId?: number | null) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("LOCATION_ID", sql.Int, id)
      .input("LINK_ID", sql.Int, linkId ?? null)
      .execute("VMaster.GET_LOCATION_MASTER");
    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_LOCATION_MASTER SP error:", error);
    throw error;
  }
};

export const saveLocationMasterService = async (data: LocationMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("LOCATION_ID", sql.Int, toInt(data.LOCATION_ID))
      .input("LOCATION_NAME", sql.VarChar(50), data.LOCATION_NAME || null)
      .input("COUNTRY_ID", sql.Int, toInt(data.COUNTRY_ID))
      .input("REGION_ID", sql.Int, toInt(data.REGION_ID))
      .input("DISTRICT_ID", sql.Int, toInt(data.DISTRICT_ID))
      .input("CAMP_ID", sql.Int, toInt(data.CAMP_ID))
      .input("STORE_ID", sql.Int, toInt(data.STORE_ID))
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .input("LINK_ID", sql.Int, data.LINK_ID ?? null)
      .execute("VMaster.SAVE_LOCATION_MASTER");
    const { message, data: id } = parseSprocResult(result.recordset?.[0], "Failed to save location");
    return { message: message || "Location saved successfully", LOCATION_ID: id || Number(data.LOCATION_ID ?? 0) };
  } catch (error) {
    console.error("SAVE_LOCATION_MASTER SP error:", error);
    throw error;
  }
};

export const updateLocationMasterService = async (data: LocationMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("LOCATION_ID", sql.Int, toInt(data.LOCATION_ID))
      .input("LOCATION_NAME", sql.VarChar(50), data.LOCATION_NAME || null)
      .input("COUNTRY_ID", sql.Int, toInt(data.COUNTRY_ID))
      .input("REGION_ID", sql.Int, toInt(data.REGION_ID))
      .input("DISTRICT_ID", sql.Int, toInt(data.DISTRICT_ID))
      .input("CAMP_ID", sql.Int, toInt(data.CAMP_ID))
      .input("STORE_ID", sql.Int, toInt(data.STORE_ID))
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .input("LINK_ID", sql.Int, data.LINK_ID ?? null)
      .execute("VMaster.UPDATE_LOCATION_MASTER");
    const { message, data: updatedId } = parseSprocResult(result.recordset?.[0], "Failed to update location");
    return { message: message || "Location updated successfully", LOCATION_ID: updatedId ?? data.LOCATION_ID };
  } catch (error) {
    console.error("UPDATE_LOCATION_MASTER SP error:", error);
    throw error;
  }
};

export const deleteLocationMasterService = async (
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
      .input("LOCATION_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_LOCATION_MASTER");
    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete");
    return { message: message || "Location deleted successfully" };
  } catch (error) {
    console.error("DELETE_LOCATION_MASTER SP error:", error);
    throw error;
  }
};
