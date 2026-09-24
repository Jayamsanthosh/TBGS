import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface BonusRequestData {
  SNO?: number;
  BONUS_REQUEST_REF_NO?: string;
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

  BONUS_TYPE?: string;
  REQUEST_AMOUNT?: number;
  APPROVED_AMOUNT?: number;
  PAYMENT_REF_NO?: string;
  PAYMENT_MODE_ID?: number;
  BANK_ID?: number;
  ACCOUNT_NO?: string;
  PAID_STATUS?: string;
  REASON?: string;

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
  BANK_ID?: number | null;
  ACCOUNT_NO?: string | null;
  PAYMENT_MODE_ID?: number | null;
}

const normalizeRow = (r: any) => ({
  ...r,
  STATUS_MASTER: r.STATUS_MASTER ?? r.STATUS ?? null,
});

const isRequestIssued = (r: any): boolean => {
  const resolved = String(
    r.FINAL_RESPONSE_STATUS || r.RESPONSE_2_STATUS || r.RESPONSE_1_STATUS || r.SECTION_HEAD_RESPONSE_STATUS || ""
  ).trim().toUpperCase();
  return resolved === "APPROVED" || resolved === "APPROVAL" || resolved === "REJECTED" || resolved === "REJECT";
};

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

const normalizeStatus = (status: string | undefined | null): string => {
  if (!status) return "AC";
  const s = status.trim().toUpperCase();
  if (s === "ACTIVE" || s === "AC") return "AC";
  if (s === "INACTIVE" || s === "IN" || s === "IA") return "IN";
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
              ,[BANK_ID]
              ,[ACCOUNT_NO]
              ,[PAYMENT_MODE_ID]
        FROM [VPayEntries].[NEW_EMPLOYEE_DATABASE]
        WHERE EMP_ID = @EMP_ID
      `);
    const row = result.recordset?.[0];
    return row ? (row as EmployeePickup) : {};
  } catch (error) {
    console.error("resolveEmployeeData error:", error);
    return {};
  }
};

const getFieldInputs = (
  data: BonusRequestData,
  approval: {
    SECTION_HEAD_RESPONSE_PERSON_EMP_ID?: number | null;
    SECTION_HEAD_RESPONSE_DATE?: Date | string | null;
    SECTION_HEAD_RESPONSE_STATUS?: string | null;
    SECTION_HEAD_RESPONSE_REMARKS?: string | null;
  } = {}
) => [
  { name: "BONUS_REQUEST_REF_NO", type: sql.VarChar(50), value: data.BONUS_REQUEST_REF_NO || null },
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

  { name: "BONUS_TYPE", type: sql.VarChar(50), value: data.BONUS_TYPE || null },
  { name: "REQUEST_AMOUNT", type: sql.Decimal(15, 2), value: numOrNull(data.REQUEST_AMOUNT) },
  {
    name: "APPROVED_AMOUNT",
    type: sql.Decimal(15, 2),
    value: numOrNull(data.APPROVED_AMOUNT) ?? numOrNull(data.REQUEST_AMOUNT),
  },
  { name: "PAYMENT_REF_NO", type: sql.VarChar(50), value: data.PAYMENT_REF_NO || null },
  { name: "PAYMENT_MODE_ID", type: sql.Int, value: numOrNull(data.PAYMENT_MODE_ID) },
  { name: "BANK_ID", type: sql.Int, value: numOrNull(data.BANK_ID) },
  { name: "ACCOUNT_NO", type: sql.VarChar(50), value: data.ACCOUNT_NO || null },
  { name: "PAID_STATUS", type: sql.VarChar(50), value: data.PAID_STATUS || null },
  { name: "REASON", type: sql.VarChar(3000), value: data.REASON || null },

  { name: "SECTION_HEAD_RESPONSE_PERSON_EMP_ID", type: sql.Int, value: numOrNull(approval.SECTION_HEAD_RESPONSE_PERSON_EMP_ID) },
  { name: "SECTION_HEAD_RESPONSE_DATE", type: sql.DateTime, value: approval.SECTION_HEAD_RESPONSE_DATE ?? null },
  { name: "SECTION_HEAD_RESPONSE_STATUS", type: sql.VarChar(50), value: approval.SECTION_HEAD_RESPONSE_STATUS ?? null },
  { name: "SECTION_HEAD_RESPONSE_REMARKS", type: sql.VarChar(50), value: approval.SECTION_HEAD_RESPONSE_REMARKS ?? null },
  { name: "RESPONSE_1_EMP_ID", type: sql.Int, value: null },
  { name: "RESPONSE_1_DATE", type: sql.DateTime, value: null },
  { name: "RESPONSE_1_STATUS", type: sql.VarChar(50), value: null },
  { name: "RESPONSE_1_REMARKS", type: sql.VarChar(50), value: null },
  { name: "RESPONSE_2_EMP_ID", type: sql.Int, value: null },
  { name: "RESPONSE_2_DATE", type: sql.DateTime, value: null },
  { name: "RESPONSE_2_STATUS", type: sql.VarChar(50), value: null },
  { name: "RESPONSE_2_REMARKS", type: sql.VarChar(50), value: null },
  { name: "FINAL_RESPONSE_EMP_ID", type: sql.Int, value: null },
  { name: "FINAL_RESPONSE_DATE", type: sql.DateTime, value: null },
  { name: "FINAL_RESPONSE_STATUS", type: sql.VarChar(50), value: null },
  { name: "FINAL_RESPONSE_REMARKS", type: sql.VarChar(50), value: null },

  { name: "REMARKS", type: sql.VarChar(1000), value: data.REMARKS || null },
  { name: "STATUS_MASTER", type: sql.VarChar(20), value: normalizeStatus(data.STATUS_MASTER) },
];

const applyInputs = (request: sql.Request, inputs: { name: string; type: any; value: any }[]) => {
  for (const input of inputs) {
    request.input(input.name, input.type, input.value);
  }
  return request;
};

export const getAllBonusRequestsService = async (status = "ALL", allowedCompanyIds?: number[], pendingOnly = false) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(20), status || "ALL")
      .query(`
        SELECT [SNO]
              ,[BONUS_REQUEST_REF_NO]
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
              ,[BONUS_TYPE]
              ,[REQUEST_AMOUNT]
              ,[APPROVED_AMOUNT]
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
        FROM [VRequest].[TBL_BONUS_REQUEST]
        WHERE @STATUS = 'ALL' OR STATUS_MASTER = @STATUS
        ORDER BY SNO DESC
      `);
    let rows: any[] = result.recordset || [];
    if (Array.isArray(allowedCompanyIds) && allowedCompanyIds.length > 0) {
      const allowed = new Set(allowedCompanyIds.map(Number));
      rows = rows.filter((r) => allowed.has(Number(r.COMPANY_ID)));
    }
    if (pendingOnly) rows = rows.filter((r) => !isRequestIssued(r));
    return rows.map((r) => normalizeRow({ ...r, id: r.SNO }));
  } catch (error) {
    console.error("TBL_BONUS_REQUEST list query error:", error);
    throw error;
  }
};

export const getBonusRequestByIdService = async (refNo: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("BONUS_REQUEST_REF_NO", sql.VarChar(50), refNo)
      .execute("VRequest.GET_BONUS_REQUEST");

    const row = result.recordset[0] || null;
    return row ? normalizeRow(row) : null;
  } catch (error) {
    console.error("GET_BONUS_REQUEST SP error:", error);
    throw error;
  }
};

export const saveBonusRequestService = async (data: BonusRequestData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const employee = await resolveEmployeeData(data.EMP_ID);

    const merged: BonusRequestData = {
      ...data,
      FIRST_NAME: data.FIRST_NAME ?? employee.FIRST_NAME ?? null,
      MIDDLE_NAME: data.MIDDLE_NAME ?? employee.MIDDLE_NAME ?? null,
      LAST_NAME: data.LAST_NAME ?? employee.LAST_NAME ?? null,
      COMPANY_ID: numOrNull(data.COMPANY_ID) ?? numOrNull(employee.COMPANY_ID),
      DEPARTMENT_ID: numOrNull(data.DEPARTMENT_ID) ?? numOrNull(employee.DEPARTMENT_ID),
      DESIGNATION_ID: numOrNull(data.DESIGNATION_ID) ?? numOrNull(employee.DESIGNATION_ID),
      DEPARTMENT_GROUP_ID:
        numOrNull(data.DEPARTMENT_GROUP_ID) ?? numOrNull(employee.DEPARTMENT_GROUP_ID),
      DESIGNATION_GROUP_ID:
        numOrNull(data.DESIGNATION_GROUP_ID) ?? numOrNull(employee.DESIGNATION_GROUP_ID),
      CAMP_ID: numOrNull(data.CAMP_ID) ?? numOrNull(employee.CAMP_ID),
      STORE_ID: numOrNull(data.STORE_ID) ?? numOrNull(employee.STORE_ID),
      EMPLOYMENT_TYPE_ID:
        numOrNull(data.EMPLOYMENT_TYPE_ID) ?? numOrNull(employee.EMPLOYMENT_TYPE_ID),
      CURRENCY_ID: numOrNull(data.CURRENCY_ID) ?? numOrNull(employee.CURRENCY_ID),
      PAYMENT_MODE_ID: numOrNull(data.PAYMENT_MODE_ID) ?? numOrNull(employee.PAYMENT_MODE_ID),
      BANK_ID: numOrNull(data.BANK_ID) ?? numOrNull(employee.BANK_ID),
      ACCOUNT_NO: data.ACCOUNT_NO ?? employee.ACCOUNT_NO ?? null,
    } as BonusRequestData;

    const request = pool.request();
    applyInputs(request, getFieldInputs(merged, {}));
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

    const result = await request.execute("VRequest.SAVE_BONUS_REQUEST");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save bonus request");

    const dataValue = savedData;
    return {
      message: message || "Data saved successfully",
      SNO: dataValue !== undefined && dataValue !== null && dataValue !== "" ? Number(dataValue) : undefined,
    };
  } catch (error) {
    console.error("SAVE_BONUS_REQUEST SP error:", error);
    throw error;
  }
};

export const updateBonusRequestService = async (data: BonusRequestData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const existing = data.BONUS_REQUEST_REF_NO
      ? await getBonusRequestByIdService(data.BONUS_REQUEST_REF_NO)
      : null;

    const employee = await resolveEmployeeData(data.EMP_ID);

    const merged: BonusRequestData = {
      ...data,
      FIRST_NAME: data.FIRST_NAME ?? existing?.FIRST_NAME ?? employee.FIRST_NAME ?? null,
      MIDDLE_NAME: data.MIDDLE_NAME ?? existing?.MIDDLE_NAME ?? employee.MIDDLE_NAME ?? null,
      LAST_NAME: data.LAST_NAME ?? existing?.LAST_NAME ?? employee.LAST_NAME ?? null,
      COMPANY_ID:
        numOrNull(data.COMPANY_ID) ?? numOrNull(existing?.COMPANY_ID) ?? numOrNull(employee.COMPANY_ID),
      DEPARTMENT_ID:
        numOrNull(data.DEPARTMENT_ID) ?? numOrNull(existing?.DEPARTMENT_ID) ?? numOrNull(employee.DEPARTMENT_ID),
      DESIGNATION_ID:
        numOrNull(data.DESIGNATION_ID) ?? numOrNull(existing?.DESIGNATION_ID) ?? numOrNull(employee.DESIGNATION_ID),
      DEPARTMENT_GROUP_ID:
        numOrNull(data.DEPARTMENT_GROUP_ID) ??
        numOrNull(existing?.DEPARTMENT_GROUP_ID) ??
        numOrNull(employee.DEPARTMENT_GROUP_ID),
      DESIGNATION_GROUP_ID:
        numOrNull(data.DESIGNATION_GROUP_ID) ??
        numOrNull(existing?.DESIGNATION_GROUP_ID) ??
        numOrNull(employee.DESIGNATION_GROUP_ID),
      CAMP_ID:
        numOrNull(data.CAMP_ID) ?? numOrNull(existing?.CAMP_ID) ?? numOrNull(employee.CAMP_ID),
      STORE_ID:
        numOrNull(data.STORE_ID) ?? numOrNull(existing?.STORE_ID) ?? numOrNull(employee.STORE_ID),
      EMPLOYMENT_TYPE_ID:
        numOrNull(data.EMPLOYMENT_TYPE_ID) ??
        numOrNull(existing?.EMPLOYMENT_TYPE_ID) ??
        numOrNull(employee.EMPLOYMENT_TYPE_ID),
      CURRENCY_ID:
        numOrNull(data.CURRENCY_ID) ?? numOrNull(existing?.CURRENCY_ID) ?? numOrNull(employee.CURRENCY_ID),
      PAYMENT_MODE_ID:
        numOrNull(data.PAYMENT_MODE_ID) ??
        numOrNull(existing?.PAYMENT_MODE_ID) ??
        numOrNull(employee.PAYMENT_MODE_ID),
      BANK_ID:
        numOrNull(data.BANK_ID) ?? numOrNull(existing?.BANK_ID) ?? numOrNull(employee.BANK_ID),
      ACCOUNT_NO: data.ACCOUNT_NO ?? existing?.ACCOUNT_NO ?? employee.ACCOUNT_NO ?? null,
    } as BonusRequestData;

    const request = pool.request();
    request.input("SNO", sql.Int, data.SNO ?? 0);
    applyInputs(request, getFieldInputs(merged, {
      SECTION_HEAD_RESPONSE_PERSON_EMP_ID: numOrNull(existing?.SECTION_HEAD_RESPONSE_PERSON_EMP_ID),
      SECTION_HEAD_RESPONSE_DATE: existing?.SECTION_HEAD_RESPONSE_DATE ?? null,
      SECTION_HEAD_RESPONSE_STATUS: existing?.SECTION_HEAD_RESPONSE_STATUS ?? null,
      SECTION_HEAD_RESPONSE_REMARKS: existing?.SECTION_HEAD_RESPONSE_REMARKS ?? null,
    }));
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

    const result = await request.execute("VRequest.UPDATE_BONUS_REQUEST");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update bonus request");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_BONUS_REQUEST SP error:", error);
    throw error;
  }
};

export const deleteBonusRequestService = async (
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
      .input("BONUS_REQUEST_REF_NO", sql.VarChar(50), refNo)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VRequest.DELETE_BONUS_REQUEST");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete bonus request");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_BONUS_REQUEST SP error:", error);
    throw error;
  }
};