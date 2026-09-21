import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface AttendanceDetailsData {
  SNO?: number;
  MONTH_ENTERED?: string;
  YEAR_ENTERED?: number;
  ATT_REQUEST_REF_NO?: string;
  EMP_ID?: number;
  FIRST_NAME?: string;
  MIDDLE_NAME?: string;
  LAST_NAME?: string;
  COMPANY_ID?: number;
  DEPARTMENT_ID?: number;
  DESIGNATION_ID?: number;
  DEPARTMENT_GROUP_ID?: number;
  DESIGNATION_GROUP_ID?: number;
  CAMP_ID?: number;
  STORE_ID?: number;
  EMPLOYMENT_TYPE_ID?: number;
  ATTENDANCE_TYPE_ID?: number;
  ELIGIBLE_DAYS?: number;
  DATE_FROM?: Date | string;
  DATE_TO?: Date | string;
  NO_OF_DAYS?: number;
  BALANCE_LEAVE?: number;
  REASON?: string;
  SECTION_HEAD_RESPONSE_PERSON_EMP_ID?: number;
  SECTION_HEAD_RESPONSE_DATE?: Date | string;
  SECTION_HEAD_RESPONSE_STATUS?: string;
  SECTION_HEAD_RESPONSE_REMARKS?: string;
  FINAL_RESPONSE_PERSON?: string;
  FINAL_RESPONSE_DATE?: Date | string;
  FINAL_RESPONSE_STATUS?: string;
  FINAL_RESPONSE_REMARKS?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const normalizeRow = (r: any) => ({
  ...r,
  STATUS_MASTER: r.STATUS_MASTER ?? r.STATUS ?? null,
});

const numOrNull = (v: any): number | null =>
  v === undefined || v === null || v === "" ? null : Number(v);

const getStatus = (r: any) => r?.STATUS ?? r?.[""]?.[0] ?? "";
const getMessage = (r: any) => r?.MESSAGE ?? r?.[""]?.[1] ?? "";
const getData = (r: any) => r?.DATA ?? r?.[""]?.[2] ?? "";

const toDateTime = (value?: Date | string): Date | null => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

export const getAllAttendanceDetailsService = async (
  status = "ALL",
  allowedCompanyIds?: number[],
  fromDate?: string,
  toDate?: string
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const dateInRange = (row: any): boolean => {
    if (!fromDate && !toDate) return true;
    if (!row) return true;
    const raw = row.CREATED_DATE ?? row.DATE_FROM;
    if (raw === undefined || raw === null || raw === "") return true;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return true;
    if (fromDate && d < new Date(`${fromDate}T00:00:00`)) return false;
    if (toDate && d > new Date(`${toDate}T23:59:59.999`)) return false;
    return true;
  };

  const applyCompanyScope = (rows: any[]): any[] => {
    if (!Array.isArray(allowedCompanyIds) || allowedCompanyIds.length === 0) return rows;
    const allowed = new Set(allowedCompanyIds.map(Number));
    return rows.filter((r) => allowed.has(Number(r.COMPANY_ID)));
  };

  try {
    if (status === "ALL") {
      const statuses = ["AC", "IN", "CL", "CA"];
      let allRows: any[] = [];
      for (const s of statuses) {
        const result = await pool
          .request()
          .input("STATUS", sql.VarChar(20), s)
          .execute("VPayEntries.SHOW_ATTENDANCE_DETAILS");
        allRows = allRows.concat(result.recordset || []);
      }
      return applyCompanyScope(allRows).map(normalizeRow).filter(dateInRange);
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(20), status)
      .execute("VPayEntries.SHOW_ATTENDANCE_DETAILS");
    return applyCompanyScope(result.recordset || []).map(normalizeRow).filter(dateInRange);
  } catch (error) {
    console.error("SHOW_ATTENDANCE_DETAILS SP error:", error);
    throw error;
  }
};

export const submitAttendanceDetailsService = async (sno: number, role = "Administrator") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, sno)
      .input("Role", sql.VarChar(50), role)
      .execute("VPayEntries.SUBMIT_ATTENDANCE_DETAILS");
    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to submit attendance detail");
    if (status && status.toLowerCase() === "error") {
      throw new Error(message);
    }
    return { message: message || "Attendance detail submitted successfully" };
  } catch (error) {
    console.error("SUBMIT_ATTENDANCE_DETAILS SP error:", error);
    throw error;
  }
};

export const getAttendanceDetailsByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, id)
      .execute("VPayEntries.GET_ATTENDANCE_DETAILS");

    const row = result.recordset[0] || null;
    return row ? normalizeRow(row) : null;
  } catch (error) {
    console.error("GET_ATTENDANCE_DETAILS SP error:", error);
    throw error;
  }
};

export const saveAttendanceDetailsService = async (data: AttendanceDetailsData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("MONTH_ENTERED", sql.VarChar(25), data.MONTH_ENTERED || null)
      .input("YEAR_ENTERED", sql.Int, numOrNull(data.YEAR_ENTERED))
      .input("ATT_REQUEST_REF_NO", sql.VarChar(50), data.ATT_REQUEST_REF_NO || null)
      .input("EMP_ID", sql.Int, numOrNull(data.EMP_ID))
      .input("FIRST_NAME", sql.VarChar(50), data.FIRST_NAME || null)
      .input("MIDDLE_NAME", sql.VarChar(50), data.MIDDLE_NAME || null)
      .input("LAST_NAME", sql.VarChar(50), data.LAST_NAME || null)
      .input("COMPANY_ID", sql.Int, numOrNull(data.COMPANY_ID))
      .input("DEPARTMENT_ID", sql.Int, numOrNull(data.DEPARTMENT_ID))
      .input("DESIGNATION_ID", sql.Int, numOrNull(data.DESIGNATION_ID))
      .input("DEPARTMENT_GROUP_ID", sql.Int, numOrNull(data.DEPARTMENT_GROUP_ID))
      .input("DESIGNATION_GROUP_ID", sql.Int, numOrNull(data.DESIGNATION_GROUP_ID))
      .input("CAMP_ID", sql.Int, numOrNull(data.CAMP_ID))
      .input("STORE_ID", sql.Int, numOrNull(data.STORE_ID))
      .input("EMPLOYMENT_TYPE_ID", sql.Int, numOrNull(data.EMPLOYMENT_TYPE_ID))
      .input("ATTENDANCE_TYPE_ID", sql.Int, numOrNull(data.ATTENDANCE_TYPE_ID))
      .input("ELIGIBLE_DAYS", sql.Decimal(10, 3), numOrNull(data.ELIGIBLE_DAYS))
      .input("DATE_FROM", sql.DateTime, toDateTime(data.DATE_FROM))
      .input("DATE_TO", sql.DateTime, toDateTime(data.DATE_TO))
      .input("NO_OF_DAYS", sql.Decimal(10, 3), numOrNull(data.NO_OF_DAYS))
      .input("BALANCE_LEAVE", sql.Decimal(10, 3), numOrNull(data.BALANCE_LEAVE))
      .input("REASON", sql.VarChar(3000), data.REASON || null)
      .input("SECTION_HEAD_RESPONSE_PERSON_EMP_ID", sql.Int, numOrNull(data.SECTION_HEAD_RESPONSE_PERSON_EMP_ID))
      .input("SECTION_HEAD_RESPONSE_DATE", sql.DateTime, toDateTime(data.SECTION_HEAD_RESPONSE_DATE))
      .input("SECTION_HEAD_RESPONSE_STATUS", sql.VarChar(50), data.SECTION_HEAD_RESPONSE_STATUS || null)
      .input("SECTION_HEAD_RESPONSE_REMARKS", sql.VarChar(50), data.SECTION_HEAD_RESPONSE_REMARKS || null)
      .input("FINAL_RESPONSE_PERSON", sql.VarChar(50), data.FINAL_RESPONSE_PERSON || null)
      .input("FINAL_RESPONSE_DATE", sql.DateTime, toDateTime(data.FINAL_RESPONSE_DATE))
      .input("FINAL_RESPONSE_STATUS", sql.VarChar(50), data.FINAL_RESPONSE_STATUS || null)
      .input("FINAL_RESPONSE_REMARKS", sql.VarChar(50), data.FINAL_RESPONSE_REMARKS || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || "AC")
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VPayEntries.SAVE_ATTENDANCE_DETAILS");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save attendance details");

    const dataValue = savedData;
    return {
      message: message || "Data saved successfully",
      SNO: dataValue !== undefined && dataValue !== null && dataValue !== "" ? Number(dataValue) : undefined,
    };
  } catch (error) {
    console.error("SAVE_ATTENDANCE_DETAILS SP error:", error);
    throw error;
  }
};

export const updateAttendanceDetailsService = async (data: AttendanceDetailsData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const existing = await getAttendanceDetailsByIdService(data.SNO ?? 0);
    if (!existing) {
      throw new Error("RECORD DOES NOT EXIST");
    }

    const result = await pool
      .request()
      .input("SNO", sql.Int, data.SNO ?? 0)
      .input("MONTH_ENTERED", sql.VarChar(25), data.MONTH_ENTERED ?? null)
      .input("YEAR_ENTERED", sql.Int, numOrNull(data.YEAR_ENTERED))
      .input("ATT_REQUEST_REF_NO", sql.VarChar(50), data.ATT_REQUEST_REF_NO ?? null)
      .input("EMP_ID", sql.Int, numOrNull(data.EMP_ID))
      .input("FIRST_NAME", sql.VarChar(50), data.FIRST_NAME ?? null)
      .input("MIDDLE_NAME", sql.VarChar(50), data.MIDDLE_NAME ?? null)
      .input("LAST_NAME", sql.VarChar(50), data.LAST_NAME ?? null)
      .input("COMPANY_ID", sql.Int, numOrNull(data.COMPANY_ID))
      .input("DEPARTMENT_ID", sql.Int, numOrNull(data.DEPARTMENT_ID))
      .input("DESIGNATION_ID", sql.Int, numOrNull(data.DESIGNATION_ID))
      .input("DEPARTMENT_GROUP_ID", sql.Int, numOrNull(data.DEPARTMENT_GROUP_ID))
      .input("DESIGNATION_GROUP_ID", sql.Int, numOrNull(data.DESIGNATION_GROUP_ID))
      .input("CAMP_ID", sql.Int, numOrNull(data.CAMP_ID))
      .input("STORE_ID", sql.Int, numOrNull(data.STORE_ID))
      .input("EMPLOYMENT_TYPE_ID", sql.Int, numOrNull(data.EMPLOYMENT_TYPE_ID))
      .input("ATTENDANCE_TYPE_ID", sql.Int, numOrNull(data.ATTENDANCE_TYPE_ID))
      .input("ELIGIBLE_DAYS", sql.Decimal(10, 3), numOrNull(data.ELIGIBLE_DAYS))
      .input("DATE_FROM", sql.DateTime, toDateTime(data.DATE_FROM))
      .input("DATE_TO", sql.DateTime, toDateTime(data.DATE_TO))
      .input("NO_OF_DAYS", sql.Decimal(10, 3), numOrNull(data.NO_OF_DAYS))
      .input("BALANCE_LEAVE", sql.Decimal(10, 3), numOrNull(data.BALANCE_LEAVE))
      .input("REASON", sql.VarChar(3000), data.REASON ?? null)
      .input("SECTION_HEAD_RESPONSE_PERSON_EMP_ID", sql.Int, numOrNull(data.SECTION_HEAD_RESPONSE_PERSON_EMP_ID))
      .input("SECTION_HEAD_RESPONSE_DATE", sql.DateTime, toDateTime(data.SECTION_HEAD_RESPONSE_DATE))
      .input("SECTION_HEAD_RESPONSE_STATUS", sql.VarChar(50), data.SECTION_HEAD_RESPONSE_STATUS ?? null)
      .input("SECTION_HEAD_RESPONSE_REMARKS", sql.VarChar(50), data.SECTION_HEAD_RESPONSE_REMARKS ?? null)
      .input("FINAL_RESPONSE_PERSON", sql.VarChar(50), data.FINAL_RESPONSE_PERSON ?? null)
      .input("FINAL_RESPONSE_DATE", sql.DateTime, toDateTime(data.FINAL_RESPONSE_DATE))
      .input("FINAL_RESPONSE_STATUS", sql.VarChar(50), data.FINAL_RESPONSE_STATUS ?? null)
      .input("FINAL_RESPONSE_REMARKS", sql.VarChar(50), data.FINAL_RESPONSE_REMARKS ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? "AC")
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VPayEntries.UPDATE_ATTENDANCE_DETAILS");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update attendance details");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_ATTENDANCE_DETAILS SP error:", error);
    throw error;
  }
};

export const deleteAttendanceDetailsService = async (
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
      .input("SNO", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VPayEntries.DELETE_ATTENDANCE_DETAILS");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete attendance details");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_ATTENDANCE_DETAILS SP error:", error);
    throw error;
  }
};