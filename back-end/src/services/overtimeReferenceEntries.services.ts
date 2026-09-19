import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface OverTimeReferenceEntriesData {
  SNO?: number;
  OT_REF_NO?: string;
  MONTH_ENTERED?: string;
  YEAR_ENTERED?: string;
  COMPANY_ID?: number;
  ACC_OT_REF_NO?: string;
  AMOUNT?: string | number;
  CURRENCY_ID?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  ROLE?: string;
  MAC_ADDRESS?: string;
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

const strOrNull = (v: any): string | null =>
  v === undefined || v === null || v === "" ? null : String(v);

const numOrNull = (v: any): number | null =>
  v === undefined || v === null || v === "" ? null : Number(v);

const normalizeStatus = (status: string | undefined | null): string => {
  if (!status) return "AC";
  const s = status.trim().toUpperCase();
  if (s === "ACTIVE" || s === "AC") return "AC";
  if (s === "INACTIVE" || s === "IN" || s === "IA") return "IN";
  return s.substring(0, 2);
};

const getFieldInputs = (data: OverTimeReferenceEntriesData) => [
  { name: "OT_REF_NO", type: sql.VarChar(50), value: strOrNull(data.OT_REF_NO) },
  { name: "MONTH_ENTERED", type: sql.VarChar(50), value: strOrNull(data.MONTH_ENTERED) },
  { name: "YEAR_ENTERED", type: sql.VarChar(50), value: strOrNull(data.YEAR_ENTERED) },
  { name: "COMPANY_ID", type: sql.Int, value: numOrNull(data.COMPANY_ID) },
  { name: "ACC_OT_REF_NO", type: sql.VarChar(50), value: strOrNull(data.ACC_OT_REF_NO) },
  { name: "AMOUNT", type: sql.VarChar(50), value: strOrNull(data.AMOUNT) },
  { name: "CURRENCY_ID", type: sql.Int, value: numOrNull(data.CURRENCY_ID) },
  { name: "REMARKS", type: sql.VarChar(1000), value: strOrNull(data.REMARKS) },
  { name: "STATUS_MASTER", type: sql.VarChar(20), value: normalizeStatus(data.STATUS_MASTER) },
];

const applyInputs = (request: sql.Request, inputs: { name: string; type: any; value: any }[]) => {
  for (const input of inputs) {
    request.input(input.name, input.type, input.value);
  }
  return request;
};

/**
 * Business rule from TBL_OVER_TIME_REFERENCE_ENTRIES:
 * same MONTH_ENTERED + YEAR_ENTERED + COMPANY_ID must not be duplicated.
 * The SAVE/UPDATE SPs do not enforce this, so we pre-check here.
 */
const checkDuplicate = async (
  pool: sql.ConnectionPool,
  data: OverTimeReferenceEntriesData,
  excludeSno?: number
): Promise<boolean> => {
  const request = pool.request();
  request.input("MONTH_ENTERED", sql.VarChar(50), data.MONTH_ENTERED || null);
  request.input("YEAR_ENTERED", sql.VarChar(50), data.YEAR_ENTERED || null);
  request.input("COMPANY_ID", sql.Int, numOrNull(data.COMPANY_ID));
  if (excludeSno !== undefined && excludeSno !== null) {
    request.input("SNO", sql.Int, excludeSno);
  }
  const result = await request.query(`
    SELECT TOP 1 1 AS FOUND
    FROM [VPayEntries].[TBL_OVER_TIME_REFERENCE_ENTRIES]
    WHERE MONTH_ENTERED = @MONTH_ENTERED
      AND YEAR_ENTERED = @YEAR_ENTERED
      AND COMPANY_ID = @COMPANY_ID
      ${excludeSno !== undefined && excludeSno !== null ? "AND SNO <> @SNO" : ""}
  `);
  return Boolean(result.recordset?.[0]?.FOUND);
};

export const getAllOverTimeReferenceEntriesService = async (status = "ALL", allowedCompanyIds?: number[], fromDate?: string, toDate?: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(20), status || "ALL")
      .input("FROM_DATE", sql.VarChar(10), fromDate || null)
      .input("TO_DATE", sql.VarChar(10), toDate || null)
      .query(`
        SELECT [a].[SNO]
              ,[a].[OT_REF_NO]
              ,[a].[MONTH_ENTERED]
              ,[a].[YEAR_ENTERED]
              ,[a].[COMPANY_ID]
              ,[cp].[COMPANY_NAME]
              ,[a].[ACC_OT_REF_NO]
              ,[a].[AMOUNT]
              ,[a].[CURRENCY_ID]
              ,[c].[CURRENCY_NAME]
              ,[a].[REMARKS]
              ,[a].[CREATED_DATE]
              ,[a].[STATUS_MASTER]
        FROM [VPayEntries].[TBL_OVER_TIME_REFERENCE_ENTRIES] a
        INNER JOIN [VMaster].[TBL_CURRENCY_MASTER] c ON a.CURRENCY_ID = c.CURRENCY_ID
        INNER JOIN [VMaster].[TBL_COMPANY_MASTER] cp ON a.COMPANY_ID = cp.COMPANY_ID
        WHERE (@STATUS = 'ALL' OR a.STATUS_MASTER = @STATUS)
          AND (@FROM_DATE IS NULL OR CAST(a.CREATED_DATE AS DATE) >= CAST(@FROM_DATE AS DATE))
          AND (@TO_DATE IS NULL OR CAST(a.CREATED_DATE AS DATE) <= CAST(@TO_DATE AS DATE))
        ORDER BY a.SNO DESC
      `);
    let rows: any[] = result.recordset || [];
    if (Array.isArray(allowedCompanyIds) && allowedCompanyIds.length > 0) {
      const allowed = new Set(allowedCompanyIds.map(Number));
      rows = rows.filter((r) => allowed.has(Number(r.COMPANY_ID)));
    }
    return rows.map((r) => ({ ...r, id: r.SNO }));
  } catch (error) {
    console.error("TBL_OVER_TIME_REFERENCE_ENTRIES list query error:", error);
    throw error;
  }
};

export const getOverTimeReferenceEntriesByIdService = async (refNo: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("OT_REF_NO", sql.VarChar(50), refNo)
      .execute("VPayEntries.GET_OVER_TIME_REFERENCE_ENTRIES");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_OVER_TIME_REFERENCE_ENTRIES SP error:", error);
    throw error;
  }
};

export const saveOverTimeReferenceEntriesService = async (data: OverTimeReferenceEntriesData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const duplicate = await checkDuplicate(pool, data);
    if (duplicate) {
      throw new Error("Over Time Reference already exists for this month, year and company");
    }

    const request = pool.request();
    applyInputs(request, getFieldInputs(data));
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

    const result = await request.execute("VPayEntries.SAVE_OVER_TIME_REFERENCE_ENTRIES");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save over time reference entry");

    const dataValue = savedData;
    return {
      message: message || "Data saved successfully",
      SNO: dataValue !== undefined && dataValue !== null && dataValue !== "" ? Number(dataValue) : undefined,
    };
  } catch (error) {
    console.error("SAVE_OVER_TIME_REFERENCE_ENTRIES SP error:", error);
    throw error;
  }
};

export const updateOverTimeReferenceEntriesService = async (data: OverTimeReferenceEntriesData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const duplicate = await checkDuplicate(pool, data, data.SNO);
    if (duplicate) {
      throw new Error("Over Time Reference already exists for this month, year and company");
    }

    const request = pool.request();
    request.input("SNO", sql.Int, data.SNO ?? 0);
    applyInputs(request, getFieldInputs(data));
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

    const result = await request.execute("VPayEntries.UPDATE_OVER_TIME_REFERENCE_ENTRIES");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update over time reference entry");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_OVER_TIME_REFERENCE_ENTRIES SP error:", error);
    throw error;
  }
};

export const submitOverTimeReferenceEntriesService = async (refNo: string, role = "Administrator") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("OT_REF_NO", sql.VarChar(50), refNo)
      .input("Role", sql.VarChar(50), role || "Administrator")
      .execute("VPayEntries.SUBMIT_OVER_TIME_REFERENCE_ENTRIES");

    const row = result.recordset?.[0];
    const text = row ? Object.values(row).join("") : "";
    const output = String(text || "").trim();

    if (/error|not found|already|invalid/i.test(output)) {
      throw new Error(output || "Failed to submit over time reference entries");
    }

    return {
      status: "",
      message: output.includes("Submitted Successfully")
        ? "Over time reference entries submitted successfully"
        : output || "Over time reference entries submitted successfully",
    };
  } catch (error) {
    console.error("SUBMIT_OVER_TIME_REFERENCE_ENTRIES SP error:", error);
    throw error;
  }
};

export const deleteOverTimeReferenceEntriesService = async (
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
      .input("OT_REF_NO", sql.VarChar(50), refNo)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VPayEntries.DELETE_OVER_TIME_REFERENCE_ENTRIES");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete over time reference entry");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_OVER_TIME_REFERENCE_ENTRIES SP error:", error);
    throw error;
  }
};