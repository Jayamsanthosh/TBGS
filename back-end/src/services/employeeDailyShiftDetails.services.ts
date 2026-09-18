import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface EmployeeDailyShiftDetailsData {
  SNO?: number;
  SHIFT_MONTH?: string;
  SHIFT_YEAR?: number;
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
  SHIFT_DATE?: Date | string;
  SHIFT_WEEK_DAY?: string;
  SHIFT_SYSTEM?: string;
  SHIFT_NAME_ID?: number;
  WEEK_DAY_ID?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  ROLE?: string;
  MAC_ADDRESS?: string;
}

const extractError = (row: any): string | null => {
  if (!row) return null;

  if (row.STATUS === "error" || row.STATUS === "ERROR") {
    return row.MESSAGE || "Operation failed";
  }

  const emptyKey = row[""];
  if (Array.isArray(emptyKey)) {
    const first = String(emptyKey[0] ?? "").toLowerCase();
    if (first === "error") {
      return String(emptyKey[1] ?? "Operation failed");
    }
  }

  const values = Object.values(row);
  if (values[0] === "error" || values[0] === "ERROR") {
    return String(values[1] ?? "Operation failed");
  }

  return null;
};

const numOrNull = (v: any): number | null =>
  v === undefined || v === null || v === "" ? null : Number(v);

const toDateTime = (value?: Date | string): Date | null => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const formatTime = (v: any): string | null => {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date && !isNaN(v.getTime())) {
    const h = String(v.getUTCHours()).padStart(2, "0");
    const m = String(v.getUTCMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  }
  const s = String(v);
  const match = s.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    return `${String(Number(match[1])).padStart(2, "0")}:${match[2]}`;
  }
  return s;
};

const formatDate = (v: any): string | null => {
  if (v === null || v === undefined || v === "") return null;
  const d = v instanceof Date ? v : new Date(v);
  if (isNaN(d.getTime())) {
    const s = String(v);
    const match = s.match(/(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : s;
  }
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
};

const formatRow = (r: any) => ({
  ...r,
  SHIFT_DATE: formatDate(r.SHIFT_DATE),
  SHIFT_IN_TIME: formatTime(r.SHIFT_IN_TIME),
  SHIFT_OUT_TIME: formatTime(r.SHIFT_OUT_TIME),
});

const serializeRecordset = (rows: any[]) =>
  (rows || []).map((r: any) => ({ ...formatRow(r), id: r.SNO }));

const LIST_QUERY = `
  SELECT
    A.[SNO],
    A.[SHIFT_MONTH],
    A.[SHIFT_YEAR],
    A.[EMP_ID],
    A.[FIRST_NAME],
    A.[MIDDLE_NAME],
    A.[LAST_NAME],
    A.[COMPANY_ID],
    C.[COMPANY_NAME],
    A.[DEPARTMENT_ID],
    DP.[DEPARTMENT_NAME],
    A.[DESIGNATION_ID],
    D.[DESIGNATION_NAME],
    A.[DEPARTMENT_GROUP_ID],
    DG.[DEPARTMENT_GROUP_NAME],
    A.[DESIGNATION_GROUP_ID],
    DS.[DESIGNATION_GROUP_NAME],
    A.[CAMP_ID],
    CP.[CAMP_NAME],
    A.[STORE_ID],
    ST.[Store_Name] AS STORE_NAME,
    A.[EMPLOYMENT_TYPE_ID],
    EP.[EMPLOYMENT_TYPE_NAME],
    A.[SHIFT_DATE],
    A.[SHIFT_WEEK_DAY],
    A.[SHIFT_SYSTEM],
    A.[SHIFT_NAME_ID],
    SH.[SHIFT_NAME],
    SH.[IN_TIME] AS SHIFT_IN_TIME,
    SH.[OUT_TIME] AS SHIFT_OUT_TIME,
    A.[WEEK_DAY_ID],
    A.[REMARKS],
    A.[STATUS_MASTER]
  FROM [VPayEntries].[TBL_EMPLOYEE_DAILY_SHIFT_DETAILS] A
    LEFT JOIN [VMaster].[TBL_SHIFT_NAME_MASTER] SH ON SH.SHIFT_NAME_ID = A.SHIFT_NAME_ID
    LEFT JOIN [VMaster].[TBL_COMPANY_MASTER] C ON C.COMPANY_ID = A.COMPANY_ID
    LEFT JOIN [VMaster].[TBL_DEPARTMENT_MASTER] DP ON DP.DEPARTMENT_ID = A.DEPARTMENT_ID
    LEFT JOIN [VMaster].[TBL_DESIGNATION_MASTER] D ON D.DESIGNATION_ID = A.DESIGNATION_ID
    LEFT JOIN [VMaster].[TBL_DEPARTMENT_GROUP_MASTER] DG ON DG.DEPARTMENT_GROUP_ID = A.DEPARTMENT_GROUP_ID
    LEFT JOIN [VMaster].[TBL_DESIGNATION_GROUP_MASTER] DS ON DS.DESIGNATION_GROUP_ID = A.DESIGNATION_GROUP_ID
    LEFT JOIN [VMaster].[TBL_CAMP_MASTER] CP ON CP.CAMP_ID = A.CAMP_ID
    LEFT JOIN [VMaster].[tbl_Store_Master] ST ON ST.Store_Id = A.STORE_ID
    LEFT JOIN [VMaster].[TBL_EMPLOYMENT_TYPE_MASTER] EP ON EP.EMPLOYMENT_TYPE_ID = A.EMPLOYMENT_TYPE_ID
`;

export const getAllEmployeeDailyShiftDetailsService = async (
  empId?: string,
  status?: string
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    if (empId && String(empId).trim() !== "") {
      const result = await pool
        .request()
        .input("EMP_ID", sql.VarChar(50), String(empId))
        .execute("VPayEntries.SHOW_EMPLOYEE_DAILY_SHIFT_DETAILS");
      return serializeRecordset(result.recordset || []);
    }

    const where: string[] = [];
    if (status && status !== "ALL") {
      where.push("A.[STATUS_MASTER] = @STATUS");
    }
    const query = `${LIST_QUERY}${where.length ? ` WHERE ${where.join(" AND ")}` : ""} ORDER BY A.[SNO] DESC`;

    const req = pool.request();
    if (where.length) {
      req.input("STATUS", sql.VarChar(20), status);
    }
    const result = await req.query(query);
    return serializeRecordset(result.recordset || []);
  } catch (error) {
    console.error("List employee daily shift details error:", error);
    throw error;
  }
};

export const getEmployeeDailyShiftDetailsByIdService = async (sno: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.BigInt, sno)
      .execute("VPayEntries.GET_EMPLOYEE_DAILY_SHIFT_DETAILS");

    const row = result.recordset[0] || null;
    return row ? formatRow(row) : null;
  } catch (error) {
    console.error("GET_EMPLOYEE_DAILY_SHIFT_DETAILS SP error:", error);
    throw error;
  }
};

const SAVE_INPUTS = (data: EmployeeDailyShiftDetailsData) => [
  { name: "SHIFT_MONTH", type: sql.VarChar(25), value: data.SHIFT_MONTH || null },
  { name: "SHIFT_YEAR", type: sql.Int, value: numOrNull(data.SHIFT_YEAR) },
  { name: "EMP_ID", type: sql.Int, value: numOrNull(data.EMP_ID) },
  { name: "FIRST_NAME", type: sql.VarChar(50), value: data.FIRST_NAME || null },
  { name: "MIDDLE_NAME", type: sql.VarChar(50), value: data.MIDDLE_NAME || null },
  { name: "LAST_NAME", type: sql.VarChar(50), value: data.LAST_NAME || null },
  { name: "COMPANY_ID", type: sql.Int, value: numOrNull(data.COMPANY_ID) },
  { name: "DEPARTMENT_ID", type: sql.Int, value: numOrNull(data.DEPARTMENT_ID) },
  { name: "DESIGNATION_ID", type: sql.Int, value: numOrNull(data.DESIGNATION_ID) },
  { name: "DEPARTMENT_GROUP_ID", type: sql.Int, value: numOrNull(data.DEPARTMENT_GROUP_ID) },
  { name: "DESIGNATION_GROUP_ID", type: sql.Int, value: numOrNull(data.DESIGNATION_GROUP_ID) },
  { name: "CAMP_ID", type: sql.Int, value: numOrNull(data.CAMP_ID) },
  { name: "STORE_ID", type: sql.Int, value: numOrNull(data.STORE_ID) },
  { name: "EMPLOYMENT_TYPE_ID", type: sql.Int, value: numOrNull(data.EMPLOYMENT_TYPE_ID) },
  { name: "SHIFT_DATE", type: sql.DateTime, value: toDateTime(data.SHIFT_DATE) },
  { name: "SHIFT_WEEK_DAY", type: sql.VarChar(50), value: data.SHIFT_WEEK_DAY || null },
  { name: "SHIFT_SYSTEM", type: sql.VarChar(10), value: data.SHIFT_SYSTEM ? String(data.SHIFT_SYSTEM).slice(0, 10) : null },
  { name: "SHIFT_NAME_ID", type: sql.Int, value: numOrNull(data.SHIFT_NAME_ID) },
  { name: "WEEK_DAY_ID", type: sql.Int, value: numOrNull(data.WEEK_DAY_ID) },
  { name: "REMARKS", type: sql.VarChar(1000), value: data.REMARKS || null },
  { name: "STATUS_MASTER", type: sql.VarChar(20), value: data.STATUS_MASTER || null },
  { name: "USER", type: sql.VarChar(50), value: data.USER || "Admin" },
  { name: "MAC_ADDRESS", type: sql.VarChar(50), value: data.MAC_ADDRESS || "WEB" },
];

export const saveEmployeeDailyShiftDetailsService = async (data: EmployeeDailyShiftDetailsData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    let request = pool.request();
    for (const input of SAVE_INPUTS(data)) {
      request = request.input(input.name, input.type, input.value);
    }
    const result = await request.execute("VPayEntries.SAVE_EMPLOYEE_DAILY_SHIFT_DETAILS");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save employee shift details");

    return {
      message: message || "Data saved successfully",
      SNO: savedData,
    };
  } catch (error) {
    console.error("SAVE_EMPLOYEE_DAILY_SHIFT_DETAILS SP error:", error);
    throw error;
  }
};

export const updateEmployeeDailyShiftDetailsService = async (data: EmployeeDailyShiftDetailsData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    let request = pool
      .request()
      .input("SNO", sql.BigInt, data.SNO ?? 0);
    for (const input of SAVE_INPUTS(data)) {
      request = request.input(input.name, input.type, input.value);
    }
    const result = await request.execute("VPayEntries.UPDATE_EMPLOYEE_DAILY_SHIFT_DETAILS");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update employee shift details");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_EMPLOYEE_DAILY_SHIFT_DETAILS SP error:", error);
    throw error;
  }
};

export const deleteEmployeeDailyShiftDetailsService = async (
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
      .input("SNO", sql.BigInt, sno)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VPayEntries.DELETE_EMPLOYEE_DAILY_SHIFT_DETAILS");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete employee shift details");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    const msg = (error as any)?.message || "";
    if (msg.includes("REFERENCE constraint") || msg.includes("FK_")) {
      throw new Error("Cannot delete: This shift detail is in use by other records.");
    }
    throw error;
  }
};