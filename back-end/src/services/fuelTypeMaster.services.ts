import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface FuelTypeMasterData {
  FUEL_TYPE_ID?: number;
  FUEL_TYPE_NAME?: string;
  FUEL_TYPE_DESCRIPTION?: string;
  ERP_PRODUCT_ID?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const toInt = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

const fuelTypeRequest = (pool: any, data: FuelTypeMasterData, includeId = true) => {
  const req = pool.request();
  if (includeId) {
    req.input("FUEL_TYPE_ID", sql.Int, toInt(data.FUEL_TYPE_ID));
  }
  req.input("FUEL_TYPE_NAME", sql.VarChar(50), data.FUEL_TYPE_NAME || null);
  req.input("FUEL_TYPE_DESCRIPTION", sql.VarChar(50), data.FUEL_TYPE_DESCRIPTION || null);
  req.input("ERP_PRODUCT_ID", sql.Int, toInt(data.ERP_PRODUCT_ID));
  req.input("REMARKS", sql.VarChar(1000), data.REMARKS || null);
  req.input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null);
  req.input("USER", sql.VarChar(50), data.USER || "Admin");
  req.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");
  return req;
};

export const getAllFuelTypeMasterService = async (status?: string) => {
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
          .execute("VMaster.SHOW_FUEL_TYPE_MASTER");
        allRows = allRows.concat(result.recordset || []);
      }
      return allRows;
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(50), status)
      .execute("VMaster.SHOW_FUEL_TYPE_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_FUEL_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const getFuelTypeMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("FUEL_TYPE_ID", sql.Int, id)
      .execute("VMaster.GET_FUEL_TYPE_MASTER");
    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_FUEL_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const getFuelTypeOptionsService = async (status = "AC") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(50), status)
      .execute("VMaster.SHOW_FUEL_TYPE_MASTER");

    return (result.recordset || []).map((r: any) => ({
      FUEL_TYPE_ID: r.FUEL_TYPE_ID,
      FUEL_TYPE_NAME: r.FUEL_TYPE_NAME,
    }));
  } catch (error) {
    console.error("SHOW_FUEL_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const saveFuelTypeMasterService = async (data: FuelTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const request = fuelTypeRequest(pool, data, false);
    request.output("FUEL_TYPE_ID", sql.Int);
    const result = await request.execute("VMaster.SAVE_FUEL_TYPE_MASTER");

    const { status, message, data: id } = parseSprocResult(result.recordset?.[0], "Failed to save fuel type");

    const newId = id || result.output?.FUEL_TYPE_ID || Number(data.FUEL_TYPE_ID ?? 0);
    return { message: message || "Data saved successfully", FUEL_TYPE_ID: newId };
  } catch (error) {
    console.error("SAVE_FUEL_TYPE_MASTER SP error:", error);
    const msg = (error as any)?.message || "";
    if ((error as any)?.number === 547 || msg.includes("FOREIGN KEY") || msg.includes("FK_")) {
      throw new Error("Cannot save: ERP Product ID is invalid or does not exist.");
    }
    throw error;
  }
};

export const updateFuelTypeMasterService = async (data: FuelTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await fuelTypeRequest(pool, data).execute("VMaster.UPDATE_FUEL_TYPE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update fuel type");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_FUEL_TYPE_MASTER SP error:", error);
    const msg = (error as any)?.message || "";
    if ((error as any)?.number === 547 || msg.includes("FOREIGN KEY") || msg.includes("FK_")) {
      throw new Error("Cannot update: ERP Product ID is invalid or does not exist.");
    }
    throw error;
  }
};

export const deleteFuelTypeMasterService = async (
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
      .input("FUEL_TYPE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_FUEL_TYPE_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    const msg = (error as any)?.message || "";
    if (msg.includes("REFERENCE constraint") || msg.includes("FK_")) {
      throw new Error("Cannot delete: This fuel type has associated records.");
    }
    throw error;
  }
};
