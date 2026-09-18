import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface LeaveEncashmentEntriesData {
  SNO?: number;
  LEAVE_ENCASHMENT_REQUEST_REF_NO?: string;
  MONTH_ENTERED?: string;
  YEAR_ENTERED?: number;

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
  CURRENCY_ID?: number;

  BALANCE_LEAVE_DAYS?: number;
  LEAVE_ENCASHMENT_DAYS?: number;

  // Salary & Allowance breakdown (from employee salary master)
  BASIC_SALARY?: number;
  FOT_ALLOWANCE?: number;
  ATTENDANCE_ALLOWANCE?: number;
  ONE_1YP_ALLOWANCE?: number;
  TECHNICAL?: number;
  POLYVALENT?: number;
  RESPONSIBILITY?: number;
  LOYALTY?: number;
  PRODUCTIVITY?: number;
  CAPACITY?: number;
  DISCIPLINARY?: number;
  HOUSE_ALLOW?: number;
  MEDICIAL?: number;
  EDUCATION?: number;
  MISCELLANIES?: number;
  NIGHT_ALLOWANCE?: number;
  EXTRA1?: number;
  EXTRA2?: number;
  EXTRA3?: number;
  EXTRA4?: number;
  EXTRA5?: number;
  EXTRA6?: number;

  LEAVE_ENCASHMENT_GROSS_AMOUNT?: number;
  PAID_STATUS?: string;
  REASON?: string;

  SECTION_HEAD_RESPONSE_PERSON_EMP_ID?: number;
  SECTION_HEAD_RESPONSE_DATE?: Date | string;
  SECTION_HEAD_RESPONSE_STATUS?: string;
  SECTION_HEAD_RESPONSE_REMARKS?: string;

  RESPONSE_1_EMP_ID?: number;
  RESPONSE_1_DATE?: Date | string;
  RESPONSE_1_STATUS?: string;
  RESPONSE_1_REMARKS?: string;

  RESPONSE_2_EMP_ID?: number;
  RESPONSE_2_DATE?: Date | string;
  RESPONSE_2_STATUS?: string;
  RESPONSE_2_REMARKS?: string;

  FINAL_RESPONSE_EMP_ID?: number;
  FINAL_RESPONSE_DATE?: Date | string;
  FINAL_RESPONSE_STATUS?: string;
  FINAL_RESPONSE_REMARKS?: string;

  REMARKS?: string;
  STATUS_MASTER?: string;

  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

interface EmployeePickup {
  FIRST_NAME?: string | null;
  MIDDLE_NAME?: string | null;
  LAST_NAME?: string | null;
  COMPANY_ID?: number | null;
  DEPARTMENT_ID?: number | null;
  DESIGNATION_ID?: number | null;
  DEPARTMENT_GROUP_ID?: number | null;
  DESIGNATION_GROUP_ID?: number | null;
  CAMP_ID?: number | null;
  STORE_ID?: number | null;
  EMPLOYMENT_TYPE_ID?: number | null;
  CURRENCY_ID?: number | null;
  LEAVE?: number | null;
  // Salary fields from employee master
  BASIC_SALARY?: number | null;
  FOT_ALLOWANCE?: number | null;
  ATTENDANCE_ALLOWANCE?: number | null;
  ONE_1YP_ALLOWANCE?: number | null;
  TECHNICAL?: number | null;
  POLYVALENT?: number | null;
  RESPONSIBILITY?: number | null;
  LOYALTY?: number | null;
  PRODUCTIVITY?: number | null;
  CAPACITY?: number | null;
  DISCIPLINARY?: number | null;
  HOUSE_ALLOW?: number | null;
  MEDICIAL?: number | null;
  EDUCATION?: number | null;
  MISCELLANIES?: number | null;
  NIGHT_ALLOWANCE?: number | null;
  EXTRA1?: number | null;
  EXTRA2?: number | null;
  EXTRA3?: number | null;
  EXTRA4?: number | null;
  EXTRA5?: number | null;
  EXTRA6?: number | null;
}

const normalizeRow = (r: any) => ({
  ...r,
  STATUS_MASTER: r.STATUS_MASTER ?? r.STATUS ?? null,
});

const parseResult = (row: any) => {
  if (!row) return { status: "", message: "", data: undefined as any };
  const arr: any[] = Array.isArray(row[""]) ? row[""] : [];
  return {
    status: row.STATUS ?? arr[0] ?? "",
    message: row.MESSAGE ?? arr[1] ?? "",
    data: row.DATA ?? arr[2],
  };
};

const numOrNull = (v: any): number | null =>
  v === undefined || v === null || v === "" ? null : Number(v);

const toDateTime = (value?: Date | string): Date | null => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const normalizeStatus = (status: string | undefined | null): string => {
  if (!status) return "AC";
  const s = status.trim().toUpperCase();
  if (s === "ACTIVE" || s === "AC") return "AC";
  if (s === "INACTIVE" || s === "IN" || s === "IA") return "IN";
  if (s === "CLOSED" || s === "CL") return "CL";
  if (s === "CANCELLED" || s === "CA") return "CA";
  return s.substring(0, 2);
};

const resolveEmployeeData = async (empId?: number): Promise<EmployeePickup> => {
  if (!empId) return {};
  const pool = getPool();
  if (!pool) return {};
  try {
    const result = await pool
      .request()
      .input("EMP_ID", sql.Int, empId)
      .query(`
        SELECT [FIRST_NAME]
              ,[MIDDLE_NAME]
              ,[LAST_NAME]
              ,[COMPANY_ID]
              ,[DEPARTMENT_ID]
              ,[DESIGNATION_ID]
              ,[DEPARTMENT_GROUP_ID]
              ,[DESIGNATION_GROUP_ID]
              ,[CAMP_ID]
              ,[STORE_ID]
              ,[EMPLOYMENT_TYPE_ID]
              ,[CURRENCY_ID]
              ,[LEAVE]
              ,[BASIC_SALARY]
              ,[FOT_ALLOWANCE]
              ,[ATTENDANCE_ALLOWANCE]
              ,[ONE_1YP_ALLOWANCE]
              ,[TECHNICAL]
              ,[POLYVALENT]
              ,[RESPONSIBILITY]
              ,[LOYALTY]
              ,[PRODUCTIVITY]
              ,[CAPACITY]
              ,[DISCIPLINARY]
              ,[HOUSE_ALLOW]
              ,[MEDICIAL]
              ,[EDUCATION]
              ,[MISCELLANIES]
              ,[NIGHT_ALLOWANCE]
              ,[EXTRA1]
              ,[EXTRA2]
              ,[EXTRA3]
              ,[EXTRA4]
              ,[EXTRA5]
              ,[EXTRA6]
        FROM [VPayEntries].[NEW_EMPLOYEE_DATABASE]
        WHERE EMP_ID = @EMP_ID
      `);
    const row = result.recordset?.[0];
    return row ? (row as EmployeePickup) : {};
  } catch (error) {
    console.error("resolveEmployeeData (leave encashment entries) error:", error);
    return {};
  }
};

const getFieldInputs = (data: LeaveEncashmentEntriesData) => [
  { name: "LEAVE_ENCASHMENT_REQUEST_REF_NO", type: sql.VarChar(50), value: data.LEAVE_ENCASHMENT_REQUEST_REF_NO || null },
  { name: "MONTH_ENTERED", type: sql.VarChar(25), value: data.MONTH_ENTERED || null },
  { name: "YEAR_ENTERED", type: sql.Int, value: numOrNull(data.YEAR_ENTERED) },

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
  { name: "CURRENCY_ID", type: sql.Int, value: numOrNull(data.CURRENCY_ID) },

  { name: "BALANCE_LEAVE_DAYS", type: sql.Decimal(8, 2), value: numOrNull(data.BALANCE_LEAVE_DAYS) },
  { name: "LEAVE_ENCASHMENT_DAYS", type: sql.Decimal(8, 2), value: numOrNull(data.LEAVE_ENCASHMENT_DAYS) },

  // Salary / allowance breakdown
  { name: "BASIC_SALARY", type: sql.Decimal(15, 2), value: numOrNull(data.BASIC_SALARY) },
  { name: "FOT_ALLOWANCE", type: sql.Decimal(15, 2), value: numOrNull(data.FOT_ALLOWANCE) },
  { name: "ATTENDANCE_ALLOWANCE", type: sql.Decimal(15, 2), value: numOrNull(data.ATTENDANCE_ALLOWANCE) },
  { name: "ONE_1YP_ALLOWANCE", type: sql.Decimal(15, 2), value: numOrNull(data.ONE_1YP_ALLOWANCE) },
  { name: "TECHNICAL", type: sql.Decimal(15, 2), value: numOrNull(data.TECHNICAL) },
  { name: "POLYVALENT", type: sql.Decimal(15, 2), value: numOrNull(data.POLYVALENT) },
  { name: "RESPONSIBILITY", type: sql.Decimal(15, 2), value: numOrNull(data.RESPONSIBILITY) },
  { name: "LOYALTY", type: sql.Decimal(15, 2), value: numOrNull(data.LOYALTY) },
  { name: "PRODUCTIVITY", type: sql.Decimal(15, 2), value: numOrNull(data.PRODUCTIVITY) },
  { name: "CAPACITY", type: sql.Decimal(15, 2), value: numOrNull(data.CAPACITY) },
  { name: "DISCIPLINARY", type: sql.Decimal(15, 2), value: numOrNull(data.DISCIPLINARY) },
  { name: "HOUSE_ALLOW", type: sql.Decimal(15, 2), value: numOrNull(data.HOUSE_ALLOW) },
  { name: "MEDICIAL", type: sql.Decimal(15, 2), value: numOrNull(data.MEDICIAL) },
  { name: "EDUCATION", type: sql.Decimal(15, 2), value: numOrNull(data.EDUCATION) },
  { name: "MISCELLANIES", type: sql.Decimal(15, 2), value: numOrNull(data.MISCELLANIES) },
  { name: "NIGHT_ALLOWANCE", type: sql.Decimal(15, 2), value: numOrNull(data.NIGHT_ALLOWANCE) },
  { name: "EXTRA1", type: sql.Decimal(15, 2), value: numOrNull(data.EXTRA1) },
  { name: "EXTRA2", type: sql.Decimal(15, 2), value: numOrNull(data.EXTRA2) },
  { name: "EXTRA3", type: sql.Decimal(15, 2), value: numOrNull(data.EXTRA3) },
  { name: "EXTRA4", type: sql.Decimal(15, 2), value: numOrNull(data.EXTRA4) },
  { name: "EXTRA5", type: sql.Decimal(15, 2), value: numOrNull(data.EXTRA5) },
  { name: "EXTRA6", type: sql.Decimal(15, 2), value: numOrNull(data.EXTRA6) },

  { name: "LEAVE_ENCASHMENT_GROSS_AMOUNT", type: sql.Decimal(15, 2), value: numOrNull(data.LEAVE_ENCASHMENT_GROSS_AMOUNT) },
  { name: "PAID_STATUS", type: sql.VarChar(50), value: data.PAID_STATUS || null },
  { name: "REASON", type: sql.VarChar(3000), value: data.REASON || null },

  { name: "SECTION_HEAD_RESPONSE_PERSON_EMP_ID", type: sql.Int, value: numOrNull(data.SECTION_HEAD_RESPONSE_PERSON_EMP_ID) },
  { name: "SECTION_HEAD_RESPONSE_DATE", type: sql.DateTime, value: toDateTime(data.SECTION_HEAD_RESPONSE_DATE) },
  { name: "SECTION_HEAD_RESPONSE_STATUS", type: sql.VarChar(50), value: data.SECTION_HEAD_RESPONSE_STATUS || null },
  { name: "SECTION_HEAD_RESPONSE_REMARKS", type: sql.VarChar(50), value: data.SECTION_HEAD_RESPONSE_REMARKS || null },

  // RESPONSE_1/2 & FINAL are set to NULL on SAVE (approval screen only)
  { name: "RESPONSE_1_EMP_ID", type: sql.Int, value: numOrNull(data.RESPONSE_1_EMP_ID) },
  { name: "RESPONSE_1_DATE", type: sql.DateTime, value: toDateTime(data.RESPONSE_1_DATE) },
  { name: "RESPONSE_1_STATUS", type: sql.VarChar(50), value: data.RESPONSE_1_STATUS || null },
  { name: "RESPONSE_1_REMARKS", type: sql.VarChar(50), value: data.RESPONSE_1_REMARKS || null },
  { name: "RESPONSE_2_EMP_ID", type: sql.Int, value: numOrNull(data.RESPONSE_2_EMP_ID) },
  { name: "RESPONSE_2_DATE", type: sql.DateTime, value: toDateTime(data.RESPONSE_2_DATE) },
  { name: "RESPONSE_2_STATUS", type: sql.VarChar(50), value: data.RESPONSE_2_STATUS || null },
  { name: "RESPONSE_2_REMARKS", type: sql.VarChar(50), value: data.RESPONSE_2_REMARKS || null },
  { name: "FINAL_RESPONSE_EMP_ID", type: sql.Int, value: numOrNull(data.FINAL_RESPONSE_EMP_ID) },
  { name: "FINAL_RESPONSE_DATE", type: sql.DateTime, value: toDateTime(data.FINAL_RESPONSE_DATE) },
  { name: "FINAL_RESPONSE_STATUS", type: sql.VarChar(50), value: data.FINAL_RESPONSE_STATUS || null },
  { name: "FINAL_RESPONSE_REMARKS", type: sql.VarChar(50), value: data.FINAL_RESPONSE_REMARKS || null },

  { name: "REMARKS", type: sql.VarChar(1000), value: data.REMARKS || null },
  { name: "STATUS_MASTER", type: sql.VarChar(20), value: normalizeStatus(data.STATUS_MASTER) },
];

const applyInputs = (request: sql.Request, inputs: { name: string; type: any; value: any }[]) => {
  for (const input of inputs) {
    request.input(input.name, input.type, input.value);
  }
  return request;
};

const mergeEmployeeAutoFill = (data: LeaveEncashmentEntriesData, emp: EmployeePickup): LeaveEncashmentEntriesData => ({
  ...data,
  FIRST_NAME: data.FIRST_NAME ?? emp.FIRST_NAME ?? null,
  MIDDLE_NAME: data.MIDDLE_NAME ?? emp.MIDDLE_NAME ?? null,
  LAST_NAME: data.LAST_NAME ?? emp.LAST_NAME ?? null,
  COMPANY_ID: numOrNull(data.COMPANY_ID) ?? numOrNull(emp.COMPANY_ID),
  DEPARTMENT_ID: numOrNull(data.DEPARTMENT_ID) ?? numOrNull(emp.DEPARTMENT_ID),
  DESIGNATION_ID: numOrNull(data.DESIGNATION_ID) ?? numOrNull(emp.DESIGNATION_ID),
  DEPARTMENT_GROUP_ID: numOrNull(data.DEPARTMENT_GROUP_ID) ?? numOrNull(emp.DEPARTMENT_GROUP_ID),
  DESIGNATION_GROUP_ID: numOrNull(data.DESIGNATION_GROUP_ID) ?? numOrNull(emp.DESIGNATION_GROUP_ID),
  CAMP_ID: numOrNull(data.CAMP_ID) ?? numOrNull(emp.CAMP_ID),
  STORE_ID: numOrNull(data.STORE_ID) ?? numOrNull(emp.STORE_ID),
  EMPLOYMENT_TYPE_ID: numOrNull(data.EMPLOYMENT_TYPE_ID) ?? numOrNull(emp.EMPLOYMENT_TYPE_ID),
  CURRENCY_ID: numOrNull(data.CURRENCY_ID) ?? numOrNull(emp.CURRENCY_ID),
  BALANCE_LEAVE_DAYS: numOrNull(data.BALANCE_LEAVE_DAYS) ?? numOrNull(emp.LEAVE),
  BASIC_SALARY: numOrNull(data.BASIC_SALARY) ?? numOrNull(emp.BASIC_SALARY),
  FOT_ALLOWANCE: numOrNull(data.FOT_ALLOWANCE) ?? numOrNull(emp.FOT_ALLOWANCE),
  ATTENDANCE_ALLOWANCE: numOrNull(data.ATTENDANCE_ALLOWANCE) ?? numOrNull(emp.ATTENDANCE_ALLOWANCE),
  ONE_1YP_ALLOWANCE: numOrNull(data.ONE_1YP_ALLOWANCE) ?? numOrNull(emp.ONE_1YP_ALLOWANCE),
  TECHNICAL: numOrNull(data.TECHNICAL) ?? numOrNull(emp.TECHNICAL),
  POLYVALENT: numOrNull(data.POLYVALENT) ?? numOrNull(emp.POLYVALENT),
  RESPONSIBILITY: numOrNull(data.RESPONSIBILITY) ?? numOrNull(emp.RESPONSIBILITY),
  LOYALTY: numOrNull(data.LOYALTY) ?? numOrNull(emp.LOYALTY),
  PRODUCTIVITY: numOrNull(data.PRODUCTIVITY) ?? numOrNull(emp.PRODUCTIVITY),
  CAPACITY: numOrNull(data.CAPACITY) ?? numOrNull(emp.CAPACITY),
  DISCIPLINARY: numOrNull(data.DISCIPLINARY) ?? numOrNull(emp.DISCIPLINARY),
  HOUSE_ALLOW: numOrNull(data.HOUSE_ALLOW) ?? numOrNull(emp.HOUSE_ALLOW),
  MEDICIAL: numOrNull(data.MEDICIAL) ?? numOrNull(emp.MEDICIAL),
  EDUCATION: numOrNull(data.EDUCATION) ?? numOrNull(emp.EDUCATION),
  MISCELLANIES: numOrNull(data.MISCELLANIES) ?? numOrNull(emp.MISCELLANIES),
  NIGHT_ALLOWANCE: numOrNull(data.NIGHT_ALLOWANCE) ?? numOrNull(emp.NIGHT_ALLOWANCE),
  EXTRA1: numOrNull(data.EXTRA1) ?? numOrNull(emp.EXTRA1),
  EXTRA2: numOrNull(data.EXTRA2) ?? numOrNull(emp.EXTRA2),
  EXTRA3: numOrNull(data.EXTRA3) ?? numOrNull(emp.EXTRA3),
  EXTRA4: numOrNull(data.EXTRA4) ?? numOrNull(emp.EXTRA4),
  EXTRA5: numOrNull(data.EXTRA5) ?? numOrNull(emp.EXTRA5),
  EXTRA6: numOrNull(data.EXTRA6) ?? numOrNull(emp.EXTRA6),
} as LeaveEncashmentEntriesData);

// ─── LIST (direct SQL, no SP provided) ─────────────────────────────────────
export const getAllLeaveEncashmentEntriesService = async (status = "ALL", allowedCompanyIds?: number[]) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(20), status || "ALL")
      .query(`
        SELECT [SNO]
              ,[LEAVE_ENCASHMENT_REQUEST_REF_NO]
              ,[MONTH_ENTERED]
              ,[YEAR_ENTERED]
              ,[EMP_ID]
              ,[FIRST_NAME]
              ,[MIDDLE_NAME]
              ,[LAST_NAME]
              ,[COMPANY_ID]
              ,[DEPARTMENT_ID]
              ,[DESIGNATION_ID]
              ,[DEPARTMENT_GROUP_ID]
              ,[DESIGNATION_GROUP_ID]
              ,[CAMP_ID]
              ,[STORE_ID]
              ,[EMPLOYMENT_TYPE_ID]
              ,[CURRENCY_ID]
              ,[BALANCE_LEAVE_DAYS]
              ,[LEAVE_ENCASHMENT_DAYS]
              ,[BASIC_SALARY]
              ,[FOT_ALLOWANCE]
              ,[ATTENDANCE_ALLOWANCE]
              ,[ONE_1YP_ALLOWANCE]
              ,[TECHNICAL]
              ,[POLYVALENT]
              ,[RESPONSIBILITY]
              ,[LOYALTY]
              ,[PRODUCTIVITY]
              ,[CAPACITY]
              ,[DISCIPLINARY]
              ,[HOUSE_ALLOW]
              ,[MEDICIAL]
              ,[EDUCATION]
              ,[MISCELLANIES]
              ,[NIGHT_ALLOWANCE]
              ,[EXTRA1],[EXTRA2],[EXTRA3],[EXTRA4],[EXTRA5],[EXTRA6]
              ,[LEAVE_ENCASHMENT_GROSS_AMOUNT]
              ,[PAID_STATUS]
              ,[REASON]
              ,[REMARKS]
              ,[STATUS_MASTER]
        FROM [VPayEntries].[TBL_LEAVE_ENCASHMENT_ENTRIES]
        WHERE @STATUS = 'ALL' OR STATUS_MASTER = @STATUS
        ORDER BY SNO DESC
      `);
    let rows: any[] = result.recordset || [];
    if (Array.isArray(allowedCompanyIds) && allowedCompanyIds.length > 0) {
      const allowed = new Set(allowedCompanyIds.map(Number));
      rows = rows.filter((r) => allowed.has(Number(r.COMPANY_ID)));
    }
    return rows.map((r) => normalizeRow({ ...r, id: r.SNO }));
  } catch (error) {
    console.error("TBL_LEAVE_ENCASHMENT_ENTRIES list query error:", error);
    throw error;
  }
};

// ─── GET BY REF NO (VPayEntries.GET_LEAVE_ENCASHMENT_ENTRIES) ──────────────
export const getLeaveEncashmentEntriesByIdService = async (refNo: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("LEAVE_ENCASHMENT_REQUEST_REF_NO", sql.VarChar(50), refNo)
      .execute("VPayEntries.GET_LEAVE_ENCASHMENT_ENTRIES");

    const row = result.recordset[0] || null;
    return row ? normalizeRow(row) : null;
  } catch (error) {
    console.error("GET_LEAVE_ENCASHMENT_ENTRIES SP error:", error);
    throw error;
  }
};

// ─── SHOW (simplified view) ────────────────────────────────────────────────
export const showLeaveEncashmentEntriesService = async (refNo: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("LEAVE_ENCASHMENT_REQUEST_REF_NO", sql.VarChar(50), refNo)
      .execute("VPayEntries.SHOW_LEAVE_ENCASHMENT_ENTRIES");

    const row = result.recordset[0] || null;
    return row ? normalizeRow(row) : null;
  } catch (error) {
    console.error("SHOW_LEAVE_ENCASHMENT_ENTRIES SP error:", error);
    throw error;
  }
};

// ─── SAVE (VPayEntries.SAVE_LEAVE_ENCASHMENT_ENTRIES) ────────────────────
export const saveLeaveEncashmentEntriesService = async (data: LeaveEncashmentEntriesData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const employee = await resolveEmployeeData(data.EMP_ID);
    const merged = mergeEmployeeAutoFill(data, employee);

    const request = pool.request();
    applyInputs(request, getFieldInputs(merged));
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

    const result = await request.execute("VPayEntries.SAVE_LEAVE_ENCASHMENT_ENTRIES");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save leave encashment entry");

    const dataValue = savedData;
    return {
      message: message || "Data saved successfully",
      SNO: dataValue !== undefined && dataValue !== null && dataValue !== "" ? Number(dataValue) : undefined,
      LEAVE_ENCASHMENT_REQUEST_REF_NO: merged.LEAVE_ENCASHMENT_REQUEST_REF_NO || undefined,
    };
  } catch (error) {
    console.error("SAVE_LEAVE_ENCASHMENT_ENTRIES SP error:", error);
    throw error;
  }
};

// ─── UPDATE ────────────────────────────────────────────────────────────────
// NOTE: The deployed UPDATE_LEAVE_ENCASHMENT_ENTRIES SP rejects the update with
// 'Leave Encashment Request Reference No Already Exists' because its guard checks
// the ENTRIES table for the ref no (which is always present for the row being
// edited) and never excludes the current row. Per requirement the SP is NOT
// modified; instead we run a direct UPDATE keyed on SNO (same pattern as the
// list query in this file).
export const updateLeaveEncashmentEntriesService = async (data: LeaveEncashmentEntriesData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const sno = numOrNull(data.SNO);
  if (!sno) throw new Error("SNO is required to update leave encashment entry");

  try {
    const rows = await pool
      .request()
      .input("SNO", sql.Int, sno)
      .query(`
        SELECT LEAVE_ENCASHMENT_REQUEST_REF_NO, STATUS_MASTER
        FROM [VPayEntries].[TBL_LEAVE_ENCASHMENT_ENTRIES]
        WHERE SNO = @SNO
      `);
    const existing = rows.recordset?.[0];
    if (!existing) throw new Error("Leave encashment entry not found");

    const employee = await resolveEmployeeData(data.EMP_ID);
    const merged = mergeEmployeeAutoFill(data, employee);

    const normalized = normalizeStatus(data.STATUS_MASTER) || existing.STATUS_MASTER || "AC";

    const request = pool.request();
    request.input("LEAVE_ENCASHMENT_REQUEST_REF_NO", sql.VarChar(50), merged.LEAVE_ENCASHMENT_REQUEST_REF_NO || existing.LEAVE_ENCASHMENT_REQUEST_REF_NO);
    request.input("MONTH_ENTERED", sql.VarChar(25), merged.MONTH_ENTERED || null);
    request.input("YEAR_ENTERED", sql.Int, numOrNull(merged.YEAR_ENTERED));
    request.input("EMP_ID", sql.Int, numOrNull(merged.EMP_ID));
    request.input("FIRST_NAME", sql.VarChar(50), merged.FIRST_NAME || null);
    request.input("MIDDLE_NAME", sql.VarChar(50), merged.MIDDLE_NAME || null);
    request.input("LAST_NAME", sql.VarChar(50), merged.LAST_NAME || null);
    request.input("COMPANY_ID", sql.Int, numOrNull(merged.COMPANY_ID));
    request.input("DEPARTMENT_ID", sql.Int, numOrNull(merged.DEPARTMENT_ID));
    request.input("DESIGNATION_ID", sql.Int, numOrNull(merged.DESIGNATION_ID));
    request.input("DEPARTMENT_GROUP_ID", sql.Int, numOrNull(merged.DEPARTMENT_GROUP_ID));
    request.input("DESIGNATION_GROUP_ID", sql.Int, numOrNull(merged.DESIGNATION_GROUP_ID));
    request.input("CAMP_ID", sql.Int, numOrNull(merged.CAMP_ID));
    request.input("STORE_ID", sql.Int, numOrNull(merged.STORE_ID));
    request.input("EMPLOYMENT_TYPE_ID", sql.Int, numOrNull(merged.EMPLOYMENT_TYPE_ID));
    request.input("CURRENCY_ID", sql.Int, numOrNull(merged.CURRENCY_ID));
    request.input("BALANCE_LEAVE_DAYS", sql.Decimal(8, 2), numOrNull(merged.BALANCE_LEAVE_DAYS));
    request.input("LEAVE_ENCASHMENT_DAYS", sql.Decimal(8, 2), numOrNull(merged.LEAVE_ENCASHMENT_DAYS));
    request.input("BASIC_SALARY", sql.Decimal(15, 2), numOrNull(merged.BASIC_SALARY));
    request.input("FOT_ALLOWANCE", sql.Decimal(15, 2), numOrNull(merged.FOT_ALLOWANCE));
    request.input("ATTENDANCE_ALLOWANCE", sql.Decimal(15, 2), numOrNull(merged.ATTENDANCE_ALLOWANCE));
    request.input("ONE_1YP_ALLOWANCE", sql.Decimal(15, 2), numOrNull(merged.ONE_1YP_ALLOWANCE));
    request.input("TECHNICAL", sql.Decimal(15, 2), numOrNull(merged.TECHNICAL));
    request.input("POLYVALENT", sql.Decimal(15, 2), numOrNull(merged.POLYVALENT));
    request.input("RESPONSIBILITY", sql.Decimal(15, 2), numOrNull(merged.RESPONSIBILITY));
    request.input("LOYALTY", sql.Decimal(15, 2), numOrNull(merged.LOYALTY));
    request.input("PRODUCTIVITY", sql.Decimal(15, 2), numOrNull(merged.PRODUCTIVITY));
    request.input("CAPACITY", sql.Decimal(15, 2), numOrNull(merged.CAPACITY));
    request.input("DISCIPLINARY", sql.Decimal(15, 2), numOrNull(merged.DISCIPLINARY));
    request.input("HOUSE_ALLOW", sql.Decimal(15, 2), numOrNull(merged.HOUSE_ALLOW));
    request.input("MEDICIAL", sql.Decimal(15, 2), numOrNull(merged.MEDICIAL));
    request.input("EDUCATION", sql.Decimal(15, 2), numOrNull(merged.EDUCATION));
    request.input("MISCELLANIES", sql.Decimal(15, 2), numOrNull(merged.MISCELLANIES));
    request.input("NIGHT_ALLOWANCE", sql.Decimal(15, 2), numOrNull(merged.NIGHT_ALLOWANCE));
    request.input("EXTRA1", sql.Decimal(15, 2), numOrNull(merged.EXTRA1));
    request.input("EXTRA2", sql.Decimal(15, 2), numOrNull(merged.EXTRA2));
    request.input("EXTRA3", sql.Decimal(15, 2), numOrNull(merged.EXTRA3));
    request.input("EXTRA4", sql.Decimal(15, 2), numOrNull(merged.EXTRA4));
    request.input("EXTRA5", sql.Decimal(15, 2), numOrNull(merged.EXTRA5));
    request.input("EXTRA6", sql.Decimal(15, 2), numOrNull(merged.EXTRA6));
    request.input("LEAVE_ENCASHMENT_GROSS_AMOUNT", sql.Decimal(15, 2), numOrNull(merged.LEAVE_ENCASHMENT_GROSS_AMOUNT));
    request.input("PAID_STATUS", sql.VarChar(50), merged.PAID_STATUS || null);
    request.input("REASON", sql.VarChar(3000), merged.REASON || null);
    request.input("REMARKS", sql.VarChar(1000), merged.REMARKS || null);
    request.input("STATUS_MASTER", sql.VarChar(20), normalized);
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");
    request.input("SNO", sql.Int, sno);

    await request.query(`
      UPDATE [VPayEntries].[TBL_LEAVE_ENCASHMENT_ENTRIES]
      SET
        LEAVE_ENCASHMENT_REQUEST_REF_NO = @LEAVE_ENCASHMENT_REQUEST_REF_NO,
        MONTH_ENTERED = @MONTH_ENTERED,
        YEAR_ENTERED = @YEAR_ENTERED,
        EMP_ID = @EMP_ID,
        FIRST_NAME = @FIRST_NAME,
        MIDDLE_NAME = @MIDDLE_NAME,
        LAST_NAME = @LAST_NAME,
        COMPANY_ID = @COMPANY_ID,
        DEPARTMENT_ID = @DEPARTMENT_ID,
        DESIGNATION_ID = @DESIGNATION_ID,
        DEPARTMENT_GROUP_ID = @DEPARTMENT_GROUP_ID,
        DESIGNATION_GROUP_ID = @DESIGNATION_GROUP_ID,
        CAMP_ID = @CAMP_ID,
        STORE_ID = @STORE_ID,
        EMPLOYMENT_TYPE_ID = @EMPLOYMENT_TYPE_ID,
        CURRENCY_ID = @CURRENCY_ID,
        BALANCE_LEAVE_DAYS = @BALANCE_LEAVE_DAYS,
        LEAVE_ENCASHMENT_DAYS = @LEAVE_ENCASHMENT_DAYS,
        BASIC_SALARY = @BASIC_SALARY,
        FOT_ALLOWANCE = @FOT_ALLOWANCE,
        ATTENDANCE_ALLOWANCE = @ATTENDANCE_ALLOWANCE,
        ONE_1YP_ALLOWANCE = @ONE_1YP_ALLOWANCE,
        TECHNICAL = @TECHNICAL,
        POLYVALENT = @POLYVALENT,
        RESPONSIBILITY = @RESPONSIBILITY,
        LOYALTY = @LOYALTY,
        PRODUCTIVITY = @PRODUCTIVITY,
        CAPACITY = @CAPACITY,
        DISCIPLINARY = @DISCIPLINARY,
        HOUSE_ALLOW = @HOUSE_ALLOW,
        MEDICIAL = @MEDICIAL,
        EDUCATION = @EDUCATION,
        MISCELLANIES = @MISCELLANIES,
        NIGHT_ALLOWANCE = @NIGHT_ALLOWANCE,
        EXTRA1 = @EXTRA1,
        EXTRA2 = @EXTRA2,
        EXTRA3 = @EXTRA3,
        EXTRA4 = @EXTRA4,
        EXTRA5 = @EXTRA5,
        EXTRA6 = @EXTRA6,
        LEAVE_ENCASHMENT_GROSS_AMOUNT = @LEAVE_ENCASHMENT_GROSS_AMOUNT,
        PAID_STATUS = @PAID_STATUS,
        REASON = @REASON,
        REMARKS = @REMARKS,
        STATUS_MASTER = @STATUS_MASTER,
        MODIFIED_BY = @USER,
        MODIFIED_DATE = GETDATE(),
        MODIFIED_MAC_ADDRESS = @MAC_ADDRESS
      WHERE SNO = @SNO
    `);

    return { message: "Record updated successfully" };
  } catch (error) {
    console.error("updateLeaveEncashmentEntriesService error:", error);
    throw error;
  }
};

// ─── DELETE (VPayEntries.DELETE_LEAVE_ENCASHMENT_ENTRIES) ─────────────────
export const deleteLeaveEncashmentEntriesService = async (
  refNo: string,
  user = "Admin",
  role = "Admin",
  macAddress = "WEB"
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("LEAVE_ENCASHMENT_REQUEST_REF_NO", sql.VarChar(50), refNo)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VPayEntries.DELETE_LEAVE_ENCASHMENT_ENTRIES");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete leave encashment entry");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_LEAVE_ENCASHMENT_ENTRIES SP error:", error);
    throw error;
  }
};