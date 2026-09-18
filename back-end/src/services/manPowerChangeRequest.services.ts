import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface ManPowerChangeRequestData {
  MAN_POWER_REQUEST_ID?: number;
  COMPANY_ID?: number;
  DEPARTMENT_ID?: number;
  DESIGNATION_ID?: number;
  EMPLOYMENT_TYPE_ID?: number;
  OLD_APPROVED_MAN_POWER?: number;
  ADD_REMOVE_MAN_POWER?: number;
  NEW_APPROVED_MAN_POWER?: number;
  SECTION_HEAD_RESPONSE_PERSON_EMP_ID?: number;
  SECTION_HEAD_RESPONSE_DATE?: string;
  SECTION_HEAD_RESPONSE_STATUS?: string;
  SECTION_HEAD_RESPONSE_REMARKS?: string;
  RESPONSE_1_EMP_ID?: number;
  RESPONSE_1_DATE?: string;
  RESPONSE_1_STATUS?: string;
  RESPONSE_1_REMARKS?: string;
  RESPONSE_2_EMP_ID?: number;
  RESPONSE_2_DATE?: string;
  RESPONSE_2_STATUS?: string;
  RESPONSE_2_REMARKS?: string;
  FINAL_RESPONSE_PERSON?: string;
  FINAL_RESPONSE_DATE?: string;
  FINAL_RESPONSE_STATUS?: string;
  FINAL_RESPONSE_REMARKS?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const normalizeStatus = (status: string | undefined | null): string => {
  if (!status) return "AC";
  const s = status.trim().toUpperCase();
  if (s === "ACTIVE" || s === "AC") return "AC";
  if (s === "INACTIVE" || s === "IN" || s === "IA") return "IA";
  return s.substring(0, 2);
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

const getFieldInputs = (data: ManPowerChangeRequestData) => [
  { name: "COMPANY_ID", type: sql.Int, value: data.COMPANY_ID ?? null },
  { name: "DEPARTMENT_ID", type: sql.Int, value: data.DEPARTMENT_ID ?? null },
  { name: "DESIGNATION_ID", type: sql.Int, value: data.DESIGNATION_ID ?? null },
  { name: "EMPLOYMENT_TYPE_ID", type: sql.Int, value: data.EMPLOYMENT_TYPE_ID ?? null },
  { name: "OLD_APPROVED_MAN_POWER", type: sql.Int, value: data.OLD_APPROVED_MAN_POWER ?? null },
  { name: "ADD_REMOVE_MAN_POWER", type: sql.Int, value: data.ADD_REMOVE_MAN_POWER ?? null },
  { name: "NEW_APPROVED_MAN_POWER", type: sql.Int, value: data.NEW_APPROVED_MAN_POWER ?? null },
  { name: "SECTION_HEAD_RESPONSE_PERSON_EMP_ID", type: sql.Int, value: data.SECTION_HEAD_RESPONSE_PERSON_EMP_ID ?? null },
  { name: "SECTION_HEAD_RESPONSE_DATE", type: sql.DateTime, value: data.SECTION_HEAD_RESPONSE_DATE || null },
  { name: "SECTION_HEAD_RESPONSE_STATUS", type: sql.VarChar(50), value: data.SECTION_HEAD_RESPONSE_STATUS || null },
  { name: "SECTION_HEAD_RESPONSE_REMARKS", type: sql.VarChar(50), value: data.SECTION_HEAD_RESPONSE_REMARKS || null },
  { name: "RESPONSE_1_EMP_ID", type: sql.Int, value: data.RESPONSE_1_EMP_ID ?? null },
  { name: "RESPONSE_1_DATE", type: sql.DateTime, value: data.RESPONSE_1_DATE || null },
  { name: "RESPONSE_1_STATUS", type: sql.VarChar(50), value: data.RESPONSE_1_STATUS || null },
  { name: "RESPONSE_1_REMARKS", type: sql.VarChar(50), value: data.RESPONSE_1_REMARKS || null },
  { name: "RESPONSE_2_EMP_ID", type: sql.Int, value: data.RESPONSE_2_EMP_ID ?? null },
  { name: "RESPONSE_2_DATE", type: sql.DateTime, value: data.RESPONSE_2_DATE || null },
  { name: "RESPONSE_2_STATUS", type: sql.VarChar(50), value: data.RESPONSE_2_STATUS || null },
  { name: "RESPONSE_2_REMARKS", type: sql.VarChar(50), value: data.RESPONSE_2_REMARKS || null },
  { name: "FINAL_RESPONSE_PERSON", type: sql.VarChar(50), value: data.FINAL_RESPONSE_PERSON || null },
  { name: "FINAL_RESPONSE_DATE", type: sql.DateTime, value: data.FINAL_RESPONSE_DATE || null },
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

export const getAllManPowerChangeRequestService = async (companyId = 0, status?: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const statuses =
      status === "ALL" || !status ? ["AC", "IA"] : [normalizeStatus(status)];
    let allRows: any[] = [];
    for (const s of statuses) {
      const result = await pool
        .request()
        .input("COMPANY_ID", sql.Int, companyId || 0)
        .input("STATUS", sql.VarChar(50), s)
        .execute("VMaster.SHOW_MAN_POWER_CHANGE_REQUEST");
      allRows = allRows.concat(result.recordset || []);
    }
    return (allRows || []).map((r: any) => ({ ...r, id: r.MAN_POWER_REQUEST_ID }));
  } catch (error) {
    console.error("SHOW_MAN_POWER_CHANGE_REQUEST SP error:", error);
    throw error;
  }
};

export const getManPowerChangeRequestByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("MAN_POWER_REQUEST_ID", sql.Int, id)
      .execute("VMaster.GET_MAN_POWER_CHANGE_REQUEST");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_MAN_POWER_CHANGE_REQUEST SP error:", error);
    throw error;
  }
};

export const saveManPowerChangeRequestService = async (data: ManPowerChangeRequestData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const request = pool.request();
    request.output("MAN_POWER_REQUEST_ID", sql.Int);
    applyInputs(request, getFieldInputs(data));
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

    const result = await request.execute("VMaster.SAVE_MAN_POWER_CHANGE_REQUEST");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save man power change request");

    const newId = savedData ?? result.output?.MAN_POWER_REQUEST_ID;
    return { message: message || "Data saved successfully", MAN_POWER_REQUEST_ID: newId };
  } catch (error) {
    console.error("SAVE_MAN_POWER_CHANGE_REQUEST SP error:", error);
    throw error;
  }
};

export const updateManPowerChangeRequestService = async (data: ManPowerChangeRequestData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const request = pool.request();
    request.input("MAN_POWER_REQUEST_ID", sql.Int, data.MAN_POWER_REQUEST_ID ?? 0);
    applyInputs(request, getFieldInputs(data));
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

    const result = await request.execute("VMaster.UPDATE_MAN_POWER_CHANGE_REQUEST");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update man power change request");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_MAN_POWER_CHANGE_REQUEST SP error:", error);
    throw error;
  }
};

export const deleteManPowerChangeRequestService = async (
  id: number,
  user = "Admin",
  role = "Manager",
  macAddress = "WEB"
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("MAN_POWER_REQUEST_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_MAN_POWER_CHANGE_REQUEST");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete man power change request");

    return { message: message || "Record deleted successfully" };
  } catch (error) {
    console.error("DELETE_MAN_POWER_CHANGE_REQUEST SP error:", error);
    throw error;
  }
};