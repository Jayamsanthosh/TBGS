import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface LaborChargeEntriesData {
  SNO?: number;
  MONTH_ENTERED?: string;
  YEAR_ENTERED?: string;
  COMPANY_ID?: number;
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

const getFieldInputs = (data: LaborChargeEntriesData) => [
  { name: "MONTH_ENTERED", type: sql.VarChar(50), value: strOrNull(data.MONTH_ENTERED) },
  { name: "YEAR_ENTERED", type: sql.VarChar(50), value: strOrNull(data.YEAR_ENTERED) },
  { name: "COMPANY_ID", type: sql.Int, value: numOrNull(data.COMPANY_ID) },
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

export const getAllLaborChargeEntriesService = async (status = "ALL", allowedCompanyIds?: number[]) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(20), status || "ALL")
      .query(`
        SELECT [a].[SNO]
              ,[a].[MONTH_ENTERED]
              ,[a].[YEAR_ENTERED]
              ,[a].[COMPANY_ID]
              ,[cp].[COMPANY_NAME]
              ,[a].[AMOUNT]
              ,[a].[CURRENCY_ID]
              ,[c].[CURRENCY_NAME]
              ,[a].[REMARKS]
              ,[a].[STATUS_MASTER]
        FROM [VPayEntries].[TBL_LABOR_CHARGE_ENTRIES] a
        INNER JOIN [VMaster].[TBL_CURRENCY_MASTER] c ON a.CURRENCY_ID = c.CURRENCY_ID
        INNER JOIN [VMaster].[TBL_COMPANY_MASTER] cp ON a.COMPANY_ID = cp.COMPANY_ID
        WHERE @STATUS = 'ALL' OR a.STATUS_MASTER = @STATUS
        ORDER BY a.SNO DESC
      `);
    let rows: any[] = result.recordset || [];
    if (Array.isArray(allowedCompanyIds) && allowedCompanyIds.length > 0) {
      const allowed = new Set(allowedCompanyIds.map(Number));
      rows = rows.filter((r) => allowed.has(Number(r.COMPANY_ID)));
    }
    return rows.map((r) => ({ ...r, id: r.SNO }));
  } catch (error) {
    console.error("TBL_LABOR_CHARGE_ENTRIES list query error:", error);
    throw error;
  }
};

export const getLaborChargeEntriesByIdService = async (sno: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, sno)
      .execute("VPayEntries.GET_LABOR_CHARGE_ENTRIES");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_LABOR_CHARGE_ENTRIES SP error:", error);
    throw error;
  }
};

export const saveLaborChargeEntriesService = async (data: LaborChargeEntriesData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const request = pool.request();
    applyInputs(request, getFieldInputs(data));
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

    const result = await request.execute("VPayEntries.SAVE_LABOR_CHARGE_ENTRIES");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save labor charge entry");

    const dataValue = savedData;
    return {
      message: message || "Data saved successfully",
      SNO: dataValue !== undefined && dataValue !== null && dataValue !== "" ? Number(dataValue) : undefined,
    };
  } catch (error) {
    console.error("SAVE_LABOR_CHARGE_ENTRIES SP error:", error);
    throw error;
  }
};

export const updateLaborChargeEntriesService = async (data: LaborChargeEntriesData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const request = pool.request();
    request.input("SNO", sql.Int, data.SNO ?? 0);
    applyInputs(request, getFieldInputs(data));
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

    const result = await request.execute("VPayEntries.UPDATE_LABOR_CHARGE_ENTRIES");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update labor charge entry");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_LABOR_CHARGE_ENTRIES SP error:", error);
    throw error;
  }
};

export const deleteLaborChargeEntriesService = async (
  sno: number,
  user = "Admin",
  role = "Admin",
  macAddress = "WEB"
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, sno)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VPayEntries.DELETE_LABOR_CHARGE_ENTRIES");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete labor charge entry");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_LABOR_CHARGE_ENTRIES SP error:", error);
    throw error;
  }
};