import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface CashAdvanceRequestData {
  SNO?: number;
  CASH_ADV_REQUEST_REF_NO?: string;
  SALARY_DEDUCTION_TYPE?: string;
  ADVANCE_TYPE?: string;
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

  GROSS_PAY?: number;
  NET_PAY?: number;
  ELIGIBLE_AMOUNT?: number;
  REQUEST_AMOUNT?: number;
  APPROVED_AMOUNT?: number;

  DEDUCTION_FROM_DATE?: Date | string;
  DEDUCTION_TO_DATE?: Date | string;
  NO_OF_MONTHS?: number;
  MONTHLY_DEDUCTION?: number;

  PAYMENT_MODE_ID?: number;
  BANK_ID?: number;
  ACCOUNT_NO?: string;

  REASON?: string;
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
  return s.substring(0, 2);
};

const getFieldInputs = (data: CashAdvanceRequestData) => [
  { name: "CASH_ADV_REQUEST_REF_NO", type: sql.VarChar(50), value: data.CASH_ADV_REQUEST_REF_NO || null },
  { name: "SALARY_DEDUCTION_TYPE", type: sql.VarChar(50), value: data.SALARY_DEDUCTION_TYPE || null },
  { name: "ADVANCE_TYPE", type: sql.VarChar(50), value: data.ADVANCE_TYPE || null },
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

  { name: "GROSS_PAY", type: sql.Decimal(15, 2), value: numOrNull(data.GROSS_PAY) },
  { name: "NET_PAY", type: sql.Decimal(15, 2), value: numOrNull(data.NET_PAY) },
  { name: "ELIGIBLE_AMOUNT", type: sql.Decimal(15, 2), value: numOrNull(data.ELIGIBLE_AMOUNT) },
  { name: "REQUEST_AMOUNT", type: sql.Decimal(15, 2), value: numOrNull(data.REQUEST_AMOUNT) },
  { name: "APPROVED_AMOUNT", type: sql.Decimal(15, 2), value: numOrNull(data.APPROVED_AMOUNT) },

  { name: "DEDUCTION_FROM_DATE", type: sql.DateTime, value: toDateTime(data.DEDUCTION_FROM_DATE) },
  { name: "DEDUCTION_TO_DATE", type: sql.DateTime, value: toDateTime(data.DEDUCTION_TO_DATE) },
  { name: "NO_OF_MONTHS", type: sql.Int, value: numOrNull(data.NO_OF_MONTHS) },
  { name: "MONTHLY_DEDUCTION", type: sql.Decimal(15, 2), value: numOrNull(data.MONTHLY_DEDUCTION) },

  { name: "PAYMENT_MODE_ID", type: sql.Int, value: numOrNull(data.PAYMENT_MODE_ID) },
  { name: "BANK_ID", type: sql.Int, value: numOrNull(data.BANK_ID) },
  { name: "ACCOUNT_NO", type: sql.VarChar(50), value: data.ACCOUNT_NO || null },

  { name: "REASON", type: sql.VarChar(3000), value: data.REASON || null },
  { name: "REMARKS", type: sql.VarChar(1000), value: data.REMARKS || null },
  { name: "STATUS_MASTER", type: sql.VarChar(20), value: normalizeStatus(data.STATUS_MASTER) },
];

const applyInputs = (request: sql.Request, inputs: { name: string; type: any; value: any }[]) => {
  for (const input of inputs) {
    request.input(input.name, input.type, input.value);
  }
  return request;
};

export const getAllCashAdvanceRequestsService = async (status = "ALL", allowedCompanyIds?: number[]) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(20), status || "ALL")
      .query(`
        SELECT [SNO]
              ,[CASH_ADV_REQUEST_REF_NO]
              ,[SALARY_DEDUCTION_TYPE]
              ,[ADVANCE_TYPE]
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
              ,[GROSS_PAY]
              ,[NET_PAY]
              ,[ELIGIBLE_AMOUNT]
              ,[REQUEST_AMOUNT]
              ,[APPROVED_AMOUNT]
              ,[DEDUCTION_FROM_DATE]
              ,[DEDUCTION_TO_DATE]
              ,[NO_OF_MONTHS]
              ,[MONTHLY_DEDUCTION]
              ,[PAYMENT_MODE_ID]
              ,[BANK_ID]
              ,[ACCOUNT_NO]
              ,[REASON]
              ,[SECTION_HEAD_RESPONSE_PERSON_EMP_ID]
              ,[SECTION_HEAD_RESPONSE_DATE]
              ,[SECTION_HEAD_RESPONSE_STATUS]
              ,[SECTION_HEAD_RESPONSE_REMARKS]
              ,[REMARKS]
              ,[STATUS_MASTER]
        FROM [VRequest].[TBL_CASH_ADVANCE_REQUEST]
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
    console.error("SHOW_CASH_ADVANCE_REQUEST list query error:", error);
    throw error;
  }
};

export const getCashAdvanceRequestByIdService = async (refNo: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("CASH_ADV_REQUEST_REF_NO", sql.VarChar(50), refNo)
      .execute("VRequest.GET_CASH_ADVANCE_REQUEST");

    const row = result.recordset[0] || null;
    return row ? normalizeRow(row) : null;
  } catch (error) {
    console.error("GET_CASH_ADVANCE_REQUEST SP error:", error);
    throw error;
  }
};

export const saveCashAdvanceRequestService = async (data: CashAdvanceRequestData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const request = pool.request();
    applyInputs(request, getFieldInputs(data));
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

    const result = await request.execute("VRequest.SAVE_CASH_ADVANCE_REQUEST");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save cash advance request");

    const dataValue = savedData;
    return {
      message: message || "Data saved successfully",
      SNO: dataValue !== undefined && dataValue !== null && dataValue !== "" ? Number(dataValue) : undefined,
    };
  } catch (error) {
    console.error("SAVE_CASH_ADVANCE_REQUEST SP error:", error);
    throw error;
  }
};

export const updateCashAdvanceRequestService = async (data: CashAdvanceRequestData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const request = pool.request();
    request.input("SNO", sql.Int, data.SNO ?? 0);
    applyInputs(request, getFieldInputs(data));
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("ROLE", sql.VarChar(50), data.ROLE || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

    const result = await request.execute("VRequest.UPDATE_CASH_ADVANCE_REQUEST");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update cash advance request");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_CASH_ADVANCE_REQUEST SP error:", error);
    throw error;
  }
};

export const deleteCashAdvanceRequestService = async (
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
      .input("CASH_ADV_REQUEST_REF_NO", sql.VarChar(50), refNo)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VRequest.DELETE_CASH_ADVANCE_REQUEST");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete cash advance request");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_CASH_ADVANCE_REQUEST SP error:", error);
    throw error;
  }
};

export const submitCashAdvanceRequestService = async (refNo: string, role: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("CASH_ADV_REQUEST_REF_NO", sql.VarChar(50), refNo)
      .input("ROLE", sql.VarChar(50), role || "Administrator")
      .execute("VMaster.SUBMIT_CASH_ADVANCE_REQUEST");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to submit cash advance request");

    return { message: message || "Submitted successfully", STATUS_MASTER: "CL" };
  } catch (error) {
    console.error("SUBMIT_CASH_ADVANCE_REQUEST SP error:", error);
    throw error;
  }
};