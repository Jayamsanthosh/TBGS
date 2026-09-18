import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface OvertimeEntriesData {
  SNO?: number;
  OT_REQUEST_REF_NO?: string;
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

  OT_FROM_DATE?: Date | string;
  OT_TO_DATE?: Date | string;
  OT_HOURS?: number;
  OT_AMOUNT?: number;
  PAYMENT_REF_NO?: string;
  PAYMENT_MODE_ID?: number;
  BANK_ID?: number;
  ACCOUNT_NO?: string;
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
  return s.substring(0, 2);
};

const getFieldInputs = (data: OvertimeEntriesData) => [
  { name: "OT_REQUEST_REF_NO", type: sql.VarChar(50), value: data.OT_REQUEST_REF_NO || null },
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

  { name: "OT_FROM_DATE", type: sql.DateTime, value: toDateTime(data.OT_FROM_DATE) },
  { name: "OT_TO_DATE", type: sql.DateTime, value: toDateTime(data.OT_TO_DATE) },
  { name: "OT_HOURS", type: sql.Decimal(10, 2), value: numOrNull(data.OT_HOURS) },
  { name: "OT_AMOUNT", type: sql.Decimal(15, 2), value: numOrNull(data.OT_AMOUNT) },
  { name: "PAYMENT_REF_NO", type: sql.VarChar(50), value: data.PAYMENT_REF_NO || null },
  { name: "PAYMENT_MODE_ID", type: sql.Int, value: numOrNull(data.PAYMENT_MODE_ID) },
  { name: "BANK_ID", type: sql.Int, value: numOrNull(data.BANK_ID) },
  { name: "ACCOUNT_NO", type: sql.VarChar(50), value: data.ACCOUNT_NO || null },
  { name: "PAID_STATUS", type: sql.VarChar(50), value: data.PAID_STATUS || null },

  { name: "REASON", type: sql.VarChar(3000), value: data.REASON || null },

  { name: "SECTION_HEAD_RESPONSE_PERSON_EMP_ID", type: sql.Int, value: numOrNull(data.SECTION_HEAD_RESPONSE_PERSON_EMP_ID) },
  { name: "SECTION_HEAD_RESPONSE_DATE", type: sql.DateTime, value: toDateTime(data.SECTION_HEAD_RESPONSE_DATE) },
  { name: "SECTION_HEAD_RESPONSE_STATUS", type: sql.VarChar(50), value: data.SECTION_HEAD_RESPONSE_STATUS || null },
  { name: "SECTION_HEAD_RESPONSE_REMARKS", type: sql.VarChar(50), value: data.SECTION_HEAD_RESPONSE_REMARKS || null },

  { name: "REMARKS", type: sql.VarChar(1000), value: data.REMARKS || null },
  { name: "STATUS_MASTER", type: sql.VarChar(20), value: normalizeStatus(data.STATUS_MASTER) },
];

const applyInputs = (request: sql.Request, inputs: { name: string; type: any; value: any }[]) => {
  for (const input of inputs) {
    request.input(input.name, input.type, input.value);
  }
  return request;
};

export const getAllOvertimeEntriesService = async (status = "ALL", allowedCompanyIds?: number[]) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(20), status || "ALL")
      .query(`
        SELECT [SNO]
              ,[OT_REQUEST_REF_NO]
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
              ,[OT_FROM_DATE]
              ,[OT_TO_DATE]
              ,[OT_HOURS]
              ,[OT_AMOUNT]
              ,[PAYMENT_REF_NO]
              ,[PAYMENT_MODE_ID]
              ,[BANK_ID]
              ,[ACCOUNT_NO]
              ,[PAID_STATUS]
              ,[REASON]
              ,[SECTION_HEAD_RESPONSE_PERSON_EMP_ID]
              ,[SECTION_HEAD_RESPONSE_DATE]
              ,[SECTION_HEAD_RESPONSE_STATUS]
              ,[SECTION_HEAD_RESPONSE_REMARKS]
              ,[RESPONSE_1_EMP_ID]
              ,[RESPONSE_1_DATE]
              ,[RESPONSE_1_STATUS]
              ,[RESPONSE_1_REMARKS]
              ,[RESPONSE_2_EMP_ID]
              ,[RESPONSE_2_DATE]
              ,[RESPONSE_2_STATUS]
              ,[RESPONSE_2_REMARKS]
              ,[FINAL_RESPONSE_EMP_ID]
              ,[FINAL_RESPONSE_DATE]
              ,[FINAL_RESPONSE_STATUS]
              ,[FINAL_RESPONSE_REMARKS]
              ,[REMARKS]
              ,[STATUS_MASTER]
        FROM [VPayEntries].[TBL_OVERTIME_ENTRIES]
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
    console.error("TBL_OVERTIME_ENTRIES list query error:", error);
    throw error;
  }
};

export const getOvertimeEntriesByIdService = async (refNo: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("OT_REQUEST_REF_NO", sql.VarChar(50), refNo)
      .execute("VPayEntries.GET_OVERTIME_ENTRIES");

    const row = result.recordset[0] || null;
    return row ? normalizeRow(row) : null;
  } catch (error) {
    console.error("GET_OVERTIME_ENTRIES SP error:", error);
    throw error;
  }
};

export const saveOvertimeEntriesService = async (data: OvertimeEntriesData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const request = pool.request();
    applyInputs(request, getFieldInputs(data));
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

    const result = await request.execute("VPayEntries.SAVE_OVERTIME_ENTRIES");

    const { status, message, data: parsedData } = parseSprocResult(result.recordset?.[0], "Failed to save overtime entry");

    const dataValue = parsedData;
    return {
      message: message || "Data saved successfully",
      SNO: dataValue !== undefined && dataValue !== null && dataValue !== "" ? Number(dataValue) : undefined,
      OT_REQUEST_REF_NO: data.OT_REQUEST_REF_NO || undefined,
    };
  } catch (error) {
    console.error("SAVE_OVERTIME_ENTRIES SP error:", error);
    throw error;
  }
};

export const updateOvertimeEntriesService = async (data: OvertimeEntriesData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const request = pool.request();
    request.input("SNO", sql.Int, data.SNO ?? 0);
    applyInputs(request, getFieldInputs(data));
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

    const result = await request.execute("VPayEntries.UPDATE_OVERTIME_ENTRIES");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update overtime entry");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_OVERTIME_ENTRIES SP error:", error);
    throw error;
  }
};

export const deleteOvertimeEntriesService = async (
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
      .input("OT_REQUEST_REF_NO", sql.VarChar(50), refNo)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VPayEntries.DELETE_OVERTIME_ENTRIES");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete overtime entry");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_OVERTIME_ENTRIES SP error:", error);
    throw error;
  }
};