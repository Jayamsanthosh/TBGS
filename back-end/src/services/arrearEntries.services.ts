import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface ArrearEntriesData {
  SNO?: number;
  ARREAR_REQUEST_REF_NO?: string;
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

  ARREAR_AMOUNT?: number;
  REASON?: string;
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

const normalizeStatus = (status: string | undefined | null): string => {
  if (!status) return "AC";
  const s = status.trim().toUpperCase();
  if (s === "ACTIVE" || s === "AC") return "AC";
  if (s === "INACTIVE" || s === "IN" || s === "IA") return "IN";
  return s.substring(0, 2);
};

const getFieldInputs = (data: ArrearEntriesData) => [
  { name: "COMPANY_ID", type: sql.Int, value: numOrNull(data.COMPANY_ID) },
  { name: "ARREAR_REQUEST_REF_NO", type: sql.VarChar(50), value: data.ARREAR_REQUEST_REF_NO || null },
  { name: "MONTH_ENTERED", type: sql.VarChar(25), value: data.MONTH_ENTERED || null },
  { name: "YEAR_ENTERED", type: sql.Int, value: numOrNull(data.YEAR_ENTERED) },

  { name: "EMP_ID", type: sql.Int, value: numOrNull(data.EMP_ID) },
  { name: "FIRST_NAME", type: sql.VarChar(50), value: data.FIRST_NAME || null },
  { name: "MIDDLE_NAME", type: sql.VarChar(50), value: data.MIDDLE_NAME || null },
  { name: "LAST_NAME", type: sql.VarChar(50), value: data.LAST_NAME || null },

  { name: "DEPARTMENT_ID", type: sql.Int, value: numOrNull(data.DEPARTMENT_ID) },
  { name: "DESIGNATION_ID", type: sql.Int, value: numOrNull(data.DESIGNATION_ID) },
  { name: "DEPARTMENT_GROUP_ID", type: sql.Int, value: numOrNull(data.DEPARTMENT_GROUP_ID) },
  { name: "DESIGNATION_GROUP_ID", type: sql.Int, value: numOrNull(data.DESIGNATION_GROUP_ID) },
  { name: "CAMP_ID", type: sql.Int, value: numOrNull(data.CAMP_ID) },
  { name: "STORE_ID", type: sql.Int, value: numOrNull(data.STORE_ID) },
  { name: "EMPLOYMENT_TYPE_ID", type: sql.Int, value: numOrNull(data.EMPLOYMENT_TYPE_ID) },
  { name: "CURRENCY_ID", type: sql.Int, value: numOrNull(data.CURRENCY_ID) },

  { name: "ARREAR_AMOUNT", type: sql.Decimal(15, 2), value: numOrNull(data.ARREAR_AMOUNT) },
  { name: "REASON", type: sql.VarChar(3000), value: data.REASON || null },
  { name: "STATUS_MASTER", type: sql.VarChar(20), value: normalizeStatus(data.STATUS_MASTER) },
];

const applyInputs = (request: sql.Request, inputs: { name: string; type: any; value: any }[]) => {
  for (const input of inputs) {
    request.input(input.name, input.type, input.value);
  }
  return request;
};

export const getAllArrearEntriesService = async (status = "ALL", allowedCompanyIds?: number[], fromDate?: string, toDate?: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const request = pool
      .request()
      .input("STATUS", sql.VarChar(20), status || "ALL")
      .input("FROM_DATE", sql.VarChar(10), fromDate || null)
      .input("TO_DATE", sql.VarChar(10), toDate || null);
    const result = await request
      .query(`
        SELECT T.[SNO]
              ,T.[ARREAR_REQUEST_REF_NO]
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
              ,T.[ARREAR_AMOUNT]
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
              ,T.[CREATED_DATE]
              ,T.[STATUS_MASTER]
        FROM [VPayEntries].[TBL_ARREAR_ENTRIES] T
        LEFT JOIN [VREQUEST].[TBL_ARREARS_REQUEST] R ON R.ARREAR_REQUEST_REF_NO = T.ARREAR_REQUEST_REF_NO
        WHERE (@STATUS = 'ALL' OR T.STATUS_MASTER = @STATUS)
          AND (@FROM_DATE IS NULL OR CAST(T.CREATED_DATE AS DATE) >= CAST(@FROM_DATE AS DATE))
          AND (@TO_DATE IS NULL OR CAST(T.CREATED_DATE AS DATE) <= CAST(@TO_DATE AS DATE))
        ORDER BY T.SNO DESC
      `);
    let rows: any[] = result.recordset || [];
    if (Array.isArray(allowedCompanyIds) && allowedCompanyIds.length > 0) {
      const allowed = new Set(allowedCompanyIds.map(Number));
      rows = rows.filter((r) => allowed.has(Number(r.COMPANY_ID)));
    }
    return rows.map((r) => normalizeRow({ ...r, id: r.SNO }));
  } catch (error) {
    console.error("TBL_ARREAR_ENTRIES list query error:", error);
    throw error;
  }
};

export const getArrearEntriesByIdService = async (refNo: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("ARREAR_REQUEST_REF_NO", sql.VarChar(50), refNo)
      .execute("VPayEntries.GET_ARREAR_ENTRIES");

    const row = result.recordset[0] || null;
    return row ? normalizeRow(row) : null;
  } catch (error) {
    console.error("GET_ARREAR_ENTRIES SP error:", error);
    throw error;
  }
};

export const saveArrearEntriesService = async (data: ArrearEntriesData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const request = pool.request();
    applyInputs(request, getFieldInputs(data));
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

    const result = await request.execute("VPayEntries.SAVE_ARREAR_ENTRIES");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save arrear entry");

    const dataValue = savedData;
    return {
      message: message || "Data saved successfully",
      SNO: dataValue !== undefined && dataValue !== null && dataValue !== "" ? Number(dataValue) : undefined,
    };
  } catch (error) {
    console.error("SAVE_ARREAR_ENTRIES SP error:", error);
    throw error;
  }
};

export const updateArrearEntriesService = async (data: ArrearEntriesData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const request = pool.request();
    request.input("SNO", sql.Int, data.SNO ?? 0);
    applyInputs(request, getFieldInputs(data));
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

    const result = await request.execute("VPayEntries.UPDATE_ARREAR_ENTRIES");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update arrear entry");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_ARREAR_ENTRIES SP error:", error);
    throw error;
  }
};

export const submitArrearEntriesService = async (refNo: string, role = "Administrator") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("ARREAR_REQUEST_REF_NO", sql.VarChar(50), refNo)
      .input("Role", sql.VarChar(50), role || "Administrator")
      .execute("VPayEntries.SUBMIT_ARREAR_ENTRIES");

    const row = result.recordset?.[0];
    const text = row ? Object.values(row).join("") : "";
    const output = String(text || "").trim();

    if (/error|not found|already|invalid/i.test(output)) {
      throw new Error(output || "Failed to submit arrear entries");
    }

    return {
      status: "",
      message: output.includes("Submitted Successfully")
        ? "Arrear entries submitted successfully"
        : output || "Arrear entries submitted successfully",
    };
  } catch (error) {
    console.error("SUBMIT_ARREAR_ENTRIES SP error:", error);
    throw error;
  }
};

export const deleteArrearEntriesService = async (
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
      .input("ARREAR_REQUEST_REF_NO", sql.VarChar(50), refNo)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VPayEntries.DELETE_ARREAR_ENTRIES");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete arrear entry");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_ARREAR_ENTRIES SP error:", error);
    throw error;
  }
};