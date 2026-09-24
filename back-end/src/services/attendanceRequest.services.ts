import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface AttendanceRequestData {
  SNO?: number;
  ATT_REQUEST_REF_NO?: string;
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

  ATTENDANCE_TYPE_ID?: number;
  ELIGIBLE_DAYS?: number;

  DATE_FROM?: Date | string;
  DATE_TO?: Date | string;
  NO_OF_DAYS?: number;
  BALANCE_LEAVE?: number;

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

const normalizeRow = (r: any) => ({
  ...r,
  STATUS_MASTER: r.STATUS_MASTER ?? r.STATUS ?? null,
});

const mergeApprovalStatuses = async (rows: any[]) => {
  const pool = getPool();
  const snos = rows.map((r) => Number(r.SNO)).filter((n) => Number.isFinite(n) && n > 0);
  if (!pool || snos.length === 0) return rows;
  const result = await pool
    .request()
    .query(
      `SELECT SNO, RESPONSE_1_STATUS, RESPONSE_1_REMARKS, RESPONSE_1_EMP_ID, RESPONSE_1_DATE,
              RESPONSE_2_STATUS, RESPONSE_2_REMARKS, RESPONSE_2_EMP_ID, RESPONSE_2_DATE,
              FINAL_RESPONSE_STATUS, FINAL_RESPONSE_REMARKS, FINAL_RESPONSE_DATE, FINAL_RESPONSE_PERSON
       FROM [VRequest].[TBL_ATTENDANCE_REQUEST] WHERE SNO IN (${snos.join(",")})`
    );
  const map = new Map(result.recordset.map((r: any) => [Number(r.SNO), r]));
  return rows.map((r) => {
    const m = map.get(Number(r.SNO)) || {};
    return {
      ...r,
      RESPONSE_1_STATUS: m.RESPONSE_1_STATUS ?? r.RESPONSE_1_STATUS ?? null,
      RESPONSE_1_REMARKS: m.RESPONSE_1_REMARKS ?? r.RESPONSE_1_REMARKS ?? null,
      RESPONSE_1_EMP_ID: m.RESPONSE_1_EMP_ID ?? r.RESPONSE_1_EMP_ID ?? null,
      RESPONSE_1_DATE: m.RESPONSE_1_DATE ?? r.RESPONSE_1_DATE ?? null,
      RESPONSE_2_STATUS: m.RESPONSE_2_STATUS ?? r.RESPONSE_2_STATUS ?? null,
      RESPONSE_2_REMARKS: m.RESPONSE_2_REMARKS ?? r.RESPONSE_2_REMARKS ?? null,
      RESPONSE_2_EMP_ID: m.RESPONSE_2_EMP_ID ?? r.RESPONSE_2_EMP_ID ?? null,
      RESPONSE_2_DATE: m.RESPONSE_2_DATE ?? r.RESPONSE_2_DATE ?? null,
      FINAL_RESPONSE_STATUS: m.FINAL_RESPONSE_STATUS ?? r.FINAL_RESPONSE_STATUS ?? null,
      FINAL_RESPONSE_REMARKS: m.FINAL_RESPONSE_REMARKS ?? r.FINAL_RESPONSE_REMARKS ?? null,
      FINAL_RESPONSE_DATE: m.FINAL_RESPONSE_DATE ?? r.FINAL_RESPONSE_DATE ?? null,
      FINAL_RESPONSE_PERSON: m.FINAL_RESPONSE_PERSON ?? r.FINAL_RESPONSE_PERSON ?? null,
    };
  });
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

const getFieldInputs = (data: AttendanceRequestData) => [
  { name: "ATT_REQUEST_REF_NO", type: sql.VarChar(50), value: data.ATT_REQUEST_REF_NO || null },
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

  { name: "ATTENDANCE_TYPE_ID", type: sql.Int, value: numOrNull(data.ATTENDANCE_TYPE_ID) },
  { name: "ELIGIBLE_DAYS", type: sql.Decimal(10, 3), value: numOrNull(data.ELIGIBLE_DAYS) },

  { name: "DATE_FROM", type: sql.DateTime, value: toDateTime(data.DATE_FROM) },
  { name: "DATE_TO", type: sql.DateTime, value: toDateTime(data.DATE_TO) },
  { name: "NO_OF_DAYS", type: sql.Decimal(10, 3), value: numOrNull(data.NO_OF_DAYS) },
  { name: "BALANCE_LEAVE", type: sql.Decimal(10, 3), value: numOrNull(data.BALANCE_LEAVE) },

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

export const getAllAttendanceRequestService = async (status = "ALL", allowedCompanyIds?: number[], pendingOnly = false) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const statuses = status === "ALL" || !status ? ["ALL"] : [normalizeStatus(status)];
    let allRows: any[] = [];
    for (const s of statuses) {
      const result = await pool
        .request()
        .input("STATUS", sql.VarChar(20), s)
        .execute("VRequest.SHOW_ATTENDANCE_REQUEST");
      allRows = allRows.concat(result.recordset || []);
    }
    if (Array.isArray(allowedCompanyIds) && allowedCompanyIds.length > 0) {
      const allowed = new Set(allowedCompanyIds.map(Number));
      allRows = allRows.filter((r) => allowed.has(Number(r.COMPANY_ID)));
    }
    allRows = await mergeApprovalStatuses(allRows);
    if (pendingOnly) {
      allRows = allRows.filter((r) => {
        // A request is "issued" once its deepest decided level is Approved/Rejected.
        const resolved = String(
          r.FINAL_RESPONSE_STATUS || r.RESPONSE_2_STATUS || r.RESPONSE_1_STATUS || r.SECTION_HEAD_RESPONSE_STATUS || ""
        ).trim().toUpperCase();
        return resolved !== "APPROVED" && resolved !== "APPROVAL" && resolved !== "REJECTED" && resolved !== "REJECT";
      });
    }
    return allRows.map((r) => normalizeRow({ ...r, id: r.SNO }));
  } catch (error) {
    console.error("SHOW_ATTENDANCE_REQUEST SP error:", error);
    throw error;
  }
};

export const getAttendanceRequestByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, id)
      .execute("VRequest.GET_ATTENDANCE_REQUEST");

    const row = result.recordset[0] || null;
    return row ? normalizeRow(row) : null;
  } catch (error) {
    console.error("GET_ATTENDANCE_REQUEST SP error:", error);
    throw error;
  }
};

export const saveAttendanceRequestService = async (data: AttendanceRequestData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const request = pool.request();
    applyInputs(request, getFieldInputs(data));
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

    const result = await request.execute("VRequest.SAVE_ATTENDANCE_REQUEST");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save attendance request");

    const dataValue = savedData;
    return {
      message: message || "Data saved successfully",
      SNO: dataValue !== undefined && dataValue !== null && dataValue !== "" ? Number(dataValue) : undefined,
    };
  } catch (error) {
    console.error("SAVE_ATTENDANCE_REQUEST SP error:", error);
    throw error;
  }
};

export const updateAttendanceRequestService = async (data: AttendanceRequestData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const request = pool.request();
    request.input("SNO", sql.Int, data.SNO ?? 0);
    applyInputs(request, getFieldInputs(data));
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

    const result = await request.execute("VRequest.UPDATE_ATTENDANCE_REQUEST");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update attendance request");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_ATTENDANCE_REQUEST SP error:", error);
    throw error;
  }
};

export const deleteAttendanceRequestService = async (
  id: number,
  user = "Admin",
  role = "Admin",
  macAddress = "WEB"
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VRequest.DELETE_ATTENDANCE_REQUEST");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete attendance request");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_ATTENDANCE_REQUEST SP error:", error);
    throw error;
  }
};