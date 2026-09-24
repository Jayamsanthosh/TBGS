import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface BonusEntriesData {
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

  SECTION_HEAD_RESPONSE_PERSON_EMP_ID?: number;
  SECTION_HEAD_RESPONSE_DATE?: Date | string;
  SECTION_HEAD_RESPONSE_STATUS?: string;
  SECTION_HEAD_RESPONSE_REMARKS?: string;

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

const getFieldInputs = (data: BonusEntriesData) => [
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

export const getAllBonusEntriesService = async (
  status = "ALL",
  allowedCompanyIds?: number[],
  fromDate?: string,
  toDate?: string
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(20), status || "ALL")
      .input("FROM_DATE", sql.VarChar(10), fromDate || null)
      .input("TO_DATE", sql.VarChar(10), toDate || null)
      .query(`
        SELECT T.[SNO]
              ,T.[BONUS_REQUEST_REF_NO]
              ,T.[MONTH_ENTERED]
              ,T.[YEAR_ENTERED]
              ,T.[EMP_ID]
              ,T.[FIRST_NAME]
              ,T.[MIDDLE_NAME]
              ,T.[LAST_NAME]
              ,T.[COMPANY_ID]
              ,T.[DEPARTMENT_ID]
              ,T.[DESIGNATION_ID]
              ,T.[DEPARTMENT_GROUP_ID]
              ,T.[DESIGNATION_GROUP_ID]
              ,T.[CAMP_ID]
              ,T.[STORE_ID]
              ,T.[EMPLOYMENT_TYPE_ID]
              ,T.[CURRENCY_ID]
              ,T.[BONUS_TYPE]
              ,T.[REQUEST_AMOUNT]
              ,T.[APPROVED_AMOUNT]
              ,T.[PAYMENT_REF_NO]
              ,T.[PAYMENT_MODE_ID]
              ,T.[BANK_ID]
              ,T.[ACCOUNT_NO]
              ,T.[PAID_STATUS]
              ,T.[REASON]
              ,T.[SECTION_HEAD_RESPONSE_PERSON_EMP_ID]
              ,T.[SECTION_HEAD_RESPONSE_DATE]
              ,COALESCE(T.[SECTION_HEAD_RESPONSE_STATUS], R.[SECTION_HEAD_RESPONSE_STATUS]) AS [SECTION_HEAD_RESPONSE_STATUS]
              ,COALESCE(T.[SECTION_HEAD_RESPONSE_REMARKS], R.[SECTION_HEAD_RESPONSE_REMARKS]) AS [SECTION_HEAD_RESPONSE_REMARKS]
              ,T.[RESPONSE_1_EMP_ID]
              ,T.[RESPONSE_1_DATE]
              ,COALESCE(T.[RESPONSE_1_STATUS], R.[RESPONSE_1_STATUS]) AS [RESPONSE_1_STATUS]
              ,COALESCE(T.[RESPONSE_1_REMARKS], R.[RESPONSE_1_REMARKS]) AS [RESPONSE_1_REMARKS]
              ,T.[RESPONSE_2_EMP_ID]
              ,T.[RESPONSE_2_DATE]
              ,COALESCE(T.[RESPONSE_2_STATUS], R.[RESPONSE_2_STATUS]) AS [RESPONSE_2_STATUS]
              ,COALESCE(T.[RESPONSE_2_REMARKS], R.[RESPONSE_2_REMARKS]) AS [RESPONSE_2_REMARKS]
              ,T.[FINAL_RESPONSE_EMP_ID]
              ,T.[FINAL_RESPONSE_DATE]
              ,COALESCE(T.[FINAL_RESPONSE_STATUS], R.[FINAL_RESPONSE_STATUS]) AS [FINAL_RESPONSE_STATUS]
              ,COALESCE(T.[FINAL_RESPONSE_REMARKS], R.[FINAL_RESPONSE_REMARKS]) AS [FINAL_RESPONSE_REMARKS]
              ,T.[REMARKS]
              ,T.[STATUS_MASTER]
              ,T.[CREATED_DATE]
        FROM [VPayEntries].[TBL_BONUS_ENTRIES] T
        LEFT JOIN [VREQUEST].[TBL_BONUS_REQUEST] R ON R.BONUS_REQUEST_REF_NO = T.BONUS_REQUEST_REF_NO
        WHERE (@STATUS = 'ALL' OR T.STATUS_MASTER = @STATUS)
          AND ((@FROM_DATE IS NULL) OR CAST(T.CREATED_DATE AS DATE) >= CAST(@FROM_DATE AS DATE))
          AND ((@TO_DATE IS NULL) OR CAST(T.CREATED_DATE AS DATE) <= CAST(@TO_DATE AS DATE))
        ORDER BY T.SNO DESC
      `);
    let rows: any[] = result.recordset || [];
    if (Array.isArray(allowedCompanyIds) && allowedCompanyIds.length > 0) {
      const allowed = new Set(allowedCompanyIds.map(Number));
      rows = rows.filter((r) => allowed.has(Number(r.COMPANY_ID)));
    }
    return rows.map((r) => normalizeRow({ ...r, id: r.SNO }));
  } catch (error) {
    console.error("TBL_BONUS_ENTRIES list query error:", error);
    throw error;
  }
};

export const getBonusEntriesByIdService = async (refNo: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("BONUS_REQUEST_REF_NO", sql.VarChar(50), refNo)
      .execute("VPayEntries.GET_BONUS_ENTRIES");

    const row = result.recordset[0] || null;
    return row ? normalizeRow(row) : null;
  } catch (error) {
    console.error("GET_BONUS_ENTRIES SP error:", error);
    throw error;
  }
};

export const showBonusEntriesService = async (refNo: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("BONUS_REQUEST_REF_NO", sql.VarChar(50), refNo)
      .execute("VPayEntries.SHOW_BONUS_ENTRIES");

    const row = result.recordset[0] || null;
    return row ? normalizeRow(row) : null;
  } catch (error) {
    console.error("SHOW_BONUS_ENTRIES SP error:", error);
    throw error;
  }
};

const mergeEmployeeAutoFill = (data: BonusEntriesData, employee: EmployeePickup): BonusEntriesData => {
  return {
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
  } as BonusEntriesData;
};

export const saveBonusEntriesService = async (data: BonusEntriesData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const employee = await resolveEmployeeData(data.EMP_ID);
    const merged = mergeEmployeeAutoFill(data, employee);

    const request = pool.request();
    applyInputs(request, getFieldInputs(merged));
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

    const result = await request.execute("VPayEntries.SAVE_BONUS_ENTRIES");

    const { status, message, data: parsedData } = parseSprocResult(result.recordset?.[0], "Failed to save bonus entry");

    const dataValue = parsedData;
    return {
      message: message || "Data saved successfully",
      SNO: dataValue !== undefined && dataValue !== null && dataValue !== "" ? Number(dataValue) : undefined,
      BONUS_REQUEST_REF_NO: data.BONUS_REQUEST_REF_NO || undefined,
    };
  } catch (error) {
    console.error("SAVE_BONUS_ENTRIES SP error:", error);
    throw error;
  }
};

export const updateBonusEntriesService = async (data: BonusEntriesData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const employee = await resolveEmployeeData(data.EMP_ID);
    const merged = mergeEmployeeAutoFill(data, employee);

    const request = pool.request();
    request.input("SNO", sql.Int, data.SNO ?? 0);
    applyInputs(request, getFieldInputs(merged));
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

    const result = await request.execute("VPayEntries.UPDATE_BONUS_ENTRIES");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update bonus entry");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_BONUS_ENTRIES SP error:", error);
    throw error;
  }
};

export const submitBonusEntriesService = async (refNo: string, role = "Administrator") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("BONUS_REQUEST_REF_NO", sql.VarChar(50), refNo)
      .input("Role", sql.VarChar(50), role || "Administrator")
      .execute("VPayEntries.SUBMIT_BONUS_ENTRIES");

    const row = result.recordset?.[0];
    const text = row ? Object.values(row).join("") : "";
    const output = String(text || "").trim();

    if (/error|not found|already|invalid/i.test(output)) {
      throw new Error(output || "Failed to submit bonus entries");
    }

    return {
      status: "",
      message: output.includes("Submitted Successfully")
        ? "Bonus entries submitted successfully"
        : output || "Bonus entries submitted successfully",
    };
  } catch (error) {
    console.error("SUBMIT_BONUS_ENTRIES SP error:", error);
    throw error;
  }
};

export const deleteBonusEntriesService = async (
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
      .execute("VPayEntries.DELETE_BONUS_ENTRIES");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete bonus entry");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_BONUS_ENTRIES SP error:", error);
    throw error;
  }
};