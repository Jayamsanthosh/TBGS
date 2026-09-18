import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface WarningFormData {
  SNO?: number;
  WARNING_REQUEST_REF_NO?: string;
  WARNING_FORM_NO?: number;
  DATE_OF_ISSUE?: Date | string;
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

  FINE_REQUIRED_STATUS?: string;
  FINE_AMOUNT?: number;
  DEDUCTION_FROM_DATE?: Date | string;
  DEDUCTION_TO_DATE?: Date | string;
  NO_OF_MONTHS?: number;
  MONTHLY_DEDUCTION_AMOUNT?: number;

  EMPLOYEE_COMMENTS?: string;
  REPORTING_MANAGER_ID?: number;
  MANAGER_COMMENTS?: string;
  COMMITTEE_MEMBER_NAME?: string;
  COMMITTEE_MEMBER_COMMENTS?: string;
  HR_MANAGER_NAME?: string;
  HR_COMMENTS?: string;
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

  REQUEST_STATUS?: string;

  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

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

const getFieldInputs = (data: WarningFormData) => [
  { name: "WARNING_REQUEST_REF_NO", type: sql.VarChar(50), value: data.WARNING_REQUEST_REF_NO || null },
  { name: "WARNING_FORM_NO", type: sql.Int, value: numOrNull(data.WARNING_FORM_NO) },
  { name: "DATE_OF_ISSUE", type: sql.DateTime, value: toDateTime(data.DATE_OF_ISSUE) },
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

  { name: "FINE_REQUIRED_STATUS", type: sql.VarChar(20), value: data.FINE_REQUIRED_STATUS || null },
  { name: "FINE_AMOUNT", type: sql.Decimal(15, 2), value: numOrNull(data.FINE_AMOUNT) },
  { name: "DEDUCTION_FROM_DATE", type: sql.DateTime, value: toDateTime(data.DEDUCTION_FROM_DATE) },
  { name: "DEDUCTION_TO_DATE", type: sql.DateTime, value: toDateTime(data.DEDUCTION_TO_DATE) },
  { name: "NO_OF_MONTHS", type: sql.Int, value: numOrNull(data.NO_OF_MONTHS) },
  { name: "MONTHLY_DEDUCTION_AMOUNT", type: sql.Decimal(15, 2), value: numOrNull(data.MONTHLY_DEDUCTION_AMOUNT) },

  { name: "EMPLOYEE_COMMENTS", type: sql.VarChar(5000), value: data.EMPLOYEE_COMMENTS || null },
  { name: "REPORTING_MANAGER_ID", type: sql.Int, value: numOrNull(data.REPORTING_MANAGER_ID) },
  { name: "MANAGER_COMMENTS", type: sql.VarChar(5000), value: data.MANAGER_COMMENTS || null },
  { name: "COMMITTEE_MEMBER_NAME", type: sql.VarChar(50), value: data.COMMITTEE_MEMBER_NAME || null },
  { name: "COMMITTEE_MEMBER_COMMENTS", type: sql.VarChar(5000), value: data.COMMITTEE_MEMBER_COMMENTS || null },
  { name: "HR_MANAGER_NAME", type: sql.VarChar(50), value: data.HR_MANAGER_NAME || null },
  { name: "HR_COMMENTS", type: sql.VarChar(5000), value: data.HR_COMMENTS || null },
  { name: "REASON", type: sql.VarChar(5000), value: data.REASON || null },

  { name: "SECTION_HEAD_RESPONSE_PERSON_EMP_ID", type: sql.Int, value: numOrNull(data.SECTION_HEAD_RESPONSE_PERSON_EMP_ID) },
  { name: "SECTION_HEAD_RESPONSE_DATE", type: sql.DateTime, value: toDateTime(data.SECTION_HEAD_RESPONSE_DATE) },
  { name: "SECTION_HEAD_RESPONSE_STATUS", type: sql.VarChar(50), value: data.SECTION_HEAD_RESPONSE_STATUS || null },
  { name: "SECTION_HEAD_RESPONSE_REMARKS", type: sql.VarChar(50), value: data.SECTION_HEAD_RESPONSE_REMARKS || null },

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

  { name: "REQUEST_STATUS", type: sql.VarChar(100), value: data.REQUEST_STATUS || null },
];

const applyInputs = (request: sql.Request, inputs: { name: string; type: any; value: any }[]) => {
  for (const input of inputs) {
    request.input(input.name, input.type, input.value);
  }
  return request;
};

export const getAllWarningFormsService = async (status = "ALL", allowedCompanyIds?: number[]) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(20), status || "ALL")
      .query(`
        SELECT
          A.[SNO],
          A.[WARNING_REQUEST_REF_NO],
          A.[WARNING_FORM_NO],
          replace(convert(varchar(50),A.[DATE_OF_ISSUE],106),' ','-') AS DATE_OF_ISSUE,
          A.[MONTH_ENTERED],
          A.[YEAR_ENTERED],
          A.[EMP_ID],
          A.[FIRST_NAME],
          A.[MIDDLE_NAME],
          A.[LAST_NAME],
          C.[COMPANY_NAME],
          DP.[DEPARTMENT_NAME],
          D.[DESIGNATION_NAME] AS DESIGNATION_name,
          DG.[DEPARTMENT_GROUP_NAME],
          DS.[DESIGNATION_GROUP_NAME],
          CP.[CAMP_NAME],
          ST.[Store_Name] AS STORE_NAME,
          EP.[EMPLOYMENT_TYPE_NAME],
          CS.[CURRENCY_NAME],
          A.[FINE_REQUIRED_STATUS],
          A.[FINE_AMOUNT],
          replace(convert(varchar(50),A.[DEDUCTION_FROM_DATE],106),' ','-') AS DEDUCTION_FROM_DATE,
          replace(convert(varchar(50),A.[DEDUCTION_TO_DATE],106),' ','-') AS DEDUCTION_TO_DATE,
          A.[NO_OF_MONTHS],
          A.[MONTHLY_DEDUCTION_AMOUNT],
          A.[EMPLOYEE_COMMENTS],
          A.[REPORTING_MANAGER_ID],
          A.[MANAGER_COMMENTS],
          A.[COMMITTEE_MEMBER_NAME],
          A.[COMMITTEE_MEMBER_COMMENTS],
          A.[HR_MANAGER_NAME],
          A.[HR_COMMENTS],
          A.[REASON],
          A.[FINAL_RESPONSE_STATUS],
          A.[FINAL_RESPONSE_REMARKS],
          A.[REQUEST_STATUS]
        FROM [VPayEntries].[TBL_WARNING_FORMS] A
          LEFT JOIN [VMaster].[TBL_DESIGNATION_MASTER] D ON D.DESIGNATION_ID = A.DESIGNATION_ID
          LEFT JOIN [VMaster].[TBL_COMPANY_MASTER] C ON C.COMPANY_ID = A.COMPANY_ID
          LEFT JOIN [VMaster].[TBL_CURRENCY_MASTER] CS ON CS.CURRENCY_ID = A.CURRENCY_ID
          LEFT JOIN [VMaster].[TBL_DEPARTMENT_MASTER] DP ON DP.DEPARTMENT_ID = A.DEPARTMENT_ID
          LEFT JOIN [VMaster].[TBL_DEPARTMENT_GROUP_MASTER] DG ON DG.DEPARTMENT_GROUP_ID = A.DEPARTMENT_GROUP_ID
          LEFT JOIN [VMaster].[TBL_DESIGNATION_GROUP_MASTER] DS ON DS.DESIGNATION_GROUP_ID = A.DESIGNATION_GROUP_ID
          LEFT JOIN [VMaster].[TBL_CAMP_MASTER] CP ON CP.CAMP_ID = A.CAMP_ID
          LEFT JOIN [VMaster].[tbl_Store_Master] ST ON ST.Store_Id = A.STORE_ID
          LEFT JOIN [VMaster].[TBL_EMPLOYMENT_TYPE_MASTER] EP ON EP.EMPLOYMENT_TYPE_ID = A.EMPLOYMENT_TYPE_ID
        WHERE (
          @STATUS = 'ALL'
          OR (@STATUS = 'PENDING' AND (A.REQUEST_STATUS IS NULL OR A.REQUEST_STATUS = ''))
          OR A.REQUEST_STATUS = @STATUS
        )
        ORDER BY A.SNO DESC
      `);
    let rows: any[] = result.recordset || [];
    if (Array.isArray(allowedCompanyIds) && allowedCompanyIds.length > 0) {
      const allowed = new Set(allowedCompanyIds.map(Number));
      rows = rows.filter((r) => allowed.has(Number(r.COMPANY_ID)));
    }
    return rows.map((r) => ({ ...r, id: r.SNO }));
  } catch (error) {
    console.error("SHOW_WARNING_FORMS list query error:", error);
    throw error;
  }
};

export const getWarningFormByIdService = async (refNo: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("WARNING_REQUEST_REF_NO", sql.VarChar(50), refNo)
      .execute("VPayEntries.GET_WARNING_FORMS");

    const row = result.recordset[0] || null;
    return row ? { ...row, id: row.SNO } : null;
  } catch (error) {
    console.error("GET_WARNING_FORMS SP error:", error);
    throw error;
  }
};

export const saveWarningFormService = async (data: WarningFormData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const request = pool.request();
    applyInputs(request, getFieldInputs(data));
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

    const result = await request.execute("VPayEntries.SAVE_WARNING_FORMS");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save warning form");

    const dataValue = savedData;
    return {
      message: message || "Data saved successfully",
      SNO: dataValue !== undefined && dataValue !== null && dataValue !== "" ? Number(dataValue) : undefined,
    };
  } catch (error) {
    console.error("SAVE_WARNING_FORMS SP error:", error);
    throw error;
  }
};

export const updateWarningFormService = async (data: WarningFormData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const request = pool.request();
    request.input("SNO", sql.BigInt, data.SNO ?? 0);
    applyInputs(request, getFieldInputs(data));
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

    const result = await request.execute("VPayEntries.UPDATE_WARNING_FORMS");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update warning form");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_WARNING_FORMS SP error:", error);
    throw error;
  }
};

export const deleteWarningFormService = async (
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
      .input("WARNING_REQUEST_REF_NO", sql.VarChar(50), refNo)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VPayEntries.DELETE_WARNING_FORMS");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete warning form");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_WARNING_FORMS SP error:", error);
    throw error;
  }
};