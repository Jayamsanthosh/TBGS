import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface DriverMasterData {
  SNO?: number;
  DRIVER_EMP_ID?: number;
  DRIVER_FULL_NAME?: string;
  COMPANY_ID?: number;
  DEPARTMENT_ID?: number;
  DESIGNATION_ID?: number;
  PHONE_NUMBER?: string;
  DRIVING_LICENSE_NUMBER?: string;
  DRIVING_LICENSE_EXPIRY_DATE?: Date | string | null;
  VEHICLE_CATEGORIES_LICENSED?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const toInt = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

const toDate = (v: any): Date | null => {
  if (v === undefined || v === null || v === "") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const driverRequest = (pool: any, data: DriverMasterData, includeId = true) => {
  const req = pool.request();
  if (includeId) {
    req.input("SNO", sql.Int, toInt(data.SNO));
  }
  req.input("DRIVER_EMP_ID", sql.Int, toInt(data.DRIVER_EMP_ID));
  req.input("DRIVER_FULL_NAME", sql.VarChar(50), data.DRIVER_FULL_NAME || null);
  req.input("COMPANY_ID", sql.Int, toInt(data.COMPANY_ID));
  req.input("DEPARTMENT_ID", sql.Int, toInt(data.DEPARTMENT_ID));
  req.input("DESIGNATION_ID", sql.Int, toInt(data.DESIGNATION_ID));
  req.input("PHONE_NUMBER", sql.VarChar(50), data.PHONE_NUMBER || null);
  req.input("DRIVING_LICENSE_NUMBER", sql.VarChar(50), data.DRIVING_LICENSE_NUMBER || null);
  req.input("DRIVING_LICENSE_EXPIRY_DATE", sql.DateTime, toDate(data.DRIVING_LICENSE_EXPIRY_DATE));
  req.input("VEHICLE_CATEGORIES_LICENSED", sql.VarChar(50), data.VEHICLE_CATEGORIES_LICENSED || null);
  req.input("REMARKS", sql.VarChar(1000), data.REMARKS || null);
  req.input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null);
  req.input("USER", sql.VarChar(50), data.USER || "Admin");
  req.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");
  return req;
};

export const getAllDriverMasterService = async (status?: string) => {
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
          .execute("VMaster.SHOW_DRIVER_MASTER_HDR");
        allRows = allRows.concat(result.recordset || []);
      }
      return allRows;
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(50), status)
      .execute("VMaster.SHOW_DRIVER_MASTER_HDR");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_DRIVER_MASTER_HDR SP error:", error);
    throw error;
  }
};

export const getDriverMasterByIdService = async (sno: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, sno)
      .execute("VMaster.GET_DRIVER_MASTER_HDR");
    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_DRIVER_MASTER_HDR SP error:", error);
    throw error;
  }
};

export const getDriverOptionsService = async (status = "AC") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(50), status)
      .execute("VMaster.SHOW_DRIVER_MASTER_HDR");

    return (result.recordset || []).map((r: any) => ({
      DRIVER_EMP_ID: r.DRIVER_EMP_ID,
      DRIVER_FULL_NAME: r.DRIVER_FULL_NAME,
      COMPANY_ID: r.COMPANY_ID,
      DEPARTMENT_ID: r.DEPARTMENT_ID,
      DESIGNATION_ID: r.DESIGNATION_ID,
      PHONE_NUMBER: r.PHONE_NUMBER,
      DRIVING_LICENSE_NUMBER: r.DRIVING_LICENSE_NUMBER,
      DRIVING_LICENSE_EXPIRY_DATE: r.DRIVING_LICENSE_EXPIRY_DATE,
    }));
  } catch (error) {
    console.error("SHOW_DRIVER_MASTER_HDR SP error:", error);
    throw error;
  }
};

export const saveDriverMasterService = async (data: DriverMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const request = driverRequest(pool, data, false);
    request.output("SNO", sql.Int);
    const result = await request.execute("VMaster.SAVE_DRIVER_MASTER_HDR");

    const { status, message, data: id } = parseSprocResult(result.recordset?.[0], "Failed to save driver");

    const newId = id || result.output?.SNO || Number(data.SNO ?? 0);
    return { message: message || "Data saved successfully", SNO: newId };
  } catch (error) {
    console.error("SAVE_DRIVER_MASTER_HDR SP error:", error);
    const msg = (error as any)?.message || "";
    if ((error as any)?.number === 547 || msg.includes("FOREIGN KEY") || msg.includes("FK_")) {
      throw new Error("Cannot save: Company, Department, or Designation is invalid.");
    }
    if (
      (error as any)?.number === 2627 ||
      msg.includes("PRIMARY KEY") ||
      msg.includes("duplicate key") ||
      msg.includes("Cannot insert duplicate")
    ) {
      throw new Error("DRIVER EMPLOYEE ID ALREADY EXISTS");
    }
    throw error;
  }
};

export const updateDriverMasterService = async (data: DriverMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await driverRequest(pool, data).execute("VMaster.UPDATE_DRIVER_MASTER_HDR");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update driver");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_DRIVER_MASTER_HDR SP error:", error);
    const msg = (error as any)?.message || "";
    if ((error as any)?.number === 547 || msg.includes("FOREIGN KEY") || msg.includes("FK_")) {
      throw new Error("Cannot update: Company, Department, or Designation is invalid.");
    }
    if (
      (error as any)?.number === 2627 ||
      msg.includes("PRIMARY KEY") ||
      msg.includes("duplicate key") ||
      msg.includes("Cannot insert duplicate")
    ) {
      throw new Error("DRIVER EMPLOYEE ID ALREADY EXISTS");
    }
    throw error;
  }
};

export const deleteDriverMasterService = async (
  sno: number,
  user: string,
  role: string,
  macAddress: string
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, sno)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_DRIVER_MASTER_HDR");

    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    const msg = (error as any)?.message || "";
    if (msg.includes("REFERENCE constraint") || msg.includes("FK_")) {
      throw new Error("Cannot delete: This driver has associated records.");
    }
    throw error;
  }
};
