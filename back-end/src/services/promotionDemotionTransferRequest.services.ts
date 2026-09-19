import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface PromotionDemotionTransferRequestData {
  SNO?: number;
  TRANSFER_REQUEST_REF_NO?: string;
  MONTH_ENTERED?: string;
  YEAR_ENTERED?: number;
  TRANSFER_TYPE?: string;
  EMP_ID?: number;
  FIRST_NAME?: string;
  MIDDLE_NAME?: string;
  LAST_NAME?: string;
  EMPLOYMENT_TYPE_ID?: number;
  CURRENCY_ID?: number;

  OLD_COMPANY_ID?: number;
  OLD_DEPARTMENT_ID?: number;
  OLD_DESIGNATION_ID?: number;
  OLD_DEPARTMENT_GROUP_ID?: number;
  OLD_DESIGNATION_GROUP_ID?: number;
  OLD_CAMP_ID?: number;
  OLD_STORE_ID?: number;
  OLD_SALARY_SCALE_ID?: number;
  OLD_BASIC_SALARY?: number;
  OLD_FOT_ALLOWANCE?: number;
  OLD_ATTENDANCE_ALLOWANCE?: number;
  OLD_ONE_1YP_ALLOWANCE?: number;
  OLD_TECHNICAL?: number;
  OLD_POLYVALENT?: number;
  OLD_RESPONSIBILITY?: number;
  OLD_LOYALTY?: number;
  OLD_PRODUCTIVITY?: number;
  OLD_CAPACITY?: number;
  OLD_DISCIPLINARY?: number;
  OLD_HOUSE_ALLOW?: number;
  OLD_MEDICIAL?: number;
  OLD_EDUCATION?: number;
  OLD_MISCELLANIES?: number;
  OLD_NIGHT_ALLOWANCE?: number;
  OLD_EXTRA1?: number;
  OLD_EXTRA2?: number;
  OLD_EXTRA3?: number;
  OLD_EXTRA4?: number;
  OLD_EXTRA5?: number;
  OLD_EXTRA6?: number;
  OLD_GROSS_AMOUNT?: number;

  NEW_COMPANY_ID?: number;
  NEW_DEPARTMENT_ID?: number;
  NEW_DESIGNATION_ID?: number;
  NEW_DEPARTMENT_GROUP_ID?: number;
  NEW_DESIGNATION_GROUP_ID?: number;
  NEW_CAMP_ID?: number;
  NEW_STORE_ID?: number;
  NEW_SALARY_SCALE_ID?: number;
  NEW_BASIC_SALARY?: number;
  NEW_FOT_ALLOWANCE?: number;
  NEW_ATTENDANCE_ALLOWANCE?: number;
  NEW_ONE_1YP_ALLOWANCE?: number;
  NEW_TECHNICAL?: number;
  NEW_POLYVALENT?: number;
  NEW_RESPONSIBILITY?: number;
  NEW_LOYALTY?: number;
  NEW_PRODUCTIVITY?: number;
  NEW_CAPACITY?: number;
  NEW_DISCIPLINARY?: number;
  NEW_HOUSE_ALLOW?: number;
  NEW_MEDICIAL?: number;
  NEW_EDUCATION?: number;
  NEW_MISCELLANIES?: number;
  NEW_NIGHT_ALLOWANCE?: number;
  NEW_EXTRA1?: number;
  NEW_EXTRA2?: number;
  NEW_EXTRA3?: number;
  NEW_EXTRA4?: number;
  NEW_EXTRA5?: number;
  NEW_EXTRA6?: number;
  NEW_GROSS_AMOUNT?: number;

  NEW_APPROVED_MAN_POWER?: number;
  NEW_CURRENT_MAN_POWER?: number;
  NEW_PENDING_MAN_POWER?: number;
  NEW_BALANCE_MAN_POWER?: number;

  REPORTING_MANAGER_ID?: number;
  REPORTING_MANAGER_COMMENTS?: string;
  MANAGER_RECOMMENDED_YN?: string;
  REASON?: string;

  REMARKS?: string;
  STATUS_MASTER?: string;
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

const isError = (status: any): boolean =>
  ["ERROR", "error"].includes(String(status).toLowerCase());

const numOrNull = (v: any): number | null =>
  v === undefined || v === null || v === "" ? null : Number(v);

const normalizeStatus = (status: string | undefined | null): string => {
  if (!status) return "AC";
  const s = status.trim().toUpperCase();
  if (s === "ACTIVE" || s === "AC") return "AC";
  if (s === "INACTIVE" || s === "IN" || s === "IA") return "IN";
  return s.substring(0, 2);
};

const getFieldInputs = (data: PromotionDemotionTransferRequestData) => [
  { name: "TRANSFER_REQUEST_REF_NO", type: sql.VarChar(50), value: data.TRANSFER_REQUEST_REF_NO || null },
  { name: "MONTH_ENTERED", type: sql.VarChar(25), value: data.MONTH_ENTERED || null },
  { name: "YEAR_ENTERED", type: sql.Int, value: numOrNull(data.YEAR_ENTERED) },
  { name: "TRANSFER_TYPE", type: sql.VarChar(50), value: data.TRANSFER_TYPE || null },
  { name: "EMP_ID", type: sql.Int, value: numOrNull(data.EMP_ID) },
  { name: "FIRST_NAME", type: sql.VarChar(50), value: data.FIRST_NAME || null },
  { name: "MIDDLE_NAME", type: sql.VarChar(50), value: data.MIDDLE_NAME || null },
  { name: "LAST_NAME", type: sql.VarChar(50), value: data.LAST_NAME || null },
  { name: "EMPLOYMENT_TYPE_ID", type: sql.Int, value: numOrNull(data.EMPLOYMENT_TYPE_ID) },
  { name: "CURRENCY_ID", type: sql.Int, value: numOrNull(data.CURRENCY_ID) },

  { name: "OLD_COMPANY_ID", type: sql.Int, value: numOrNull(data.OLD_COMPANY_ID) },
  { name: "OLD_DEPARTMENT_ID", type: sql.Int, value: numOrNull(data.OLD_DEPARTMENT_ID) },
  { name: "OLD_DESIGNATION_ID", type: sql.Int, value: numOrNull(data.OLD_DESIGNATION_ID) },
  { name: "OLD_DEPARTMENT_GROUP_ID", type: sql.Int, value: numOrNull(data.OLD_DEPARTMENT_GROUP_ID) },
  { name: "OLD_DESIGNATION_GROUP_ID", type: sql.Int, value: numOrNull(data.OLD_DESIGNATION_GROUP_ID) },
  { name: "OLD_CAMP_ID", type: sql.Int, value: numOrNull(data.OLD_CAMP_ID) },
  { name: "OLD_STORE_ID", type: sql.Int, value: numOrNull(data.OLD_STORE_ID) },
  { name: "OLD_SALARY_SCALE_ID", type: sql.Int, value: numOrNull(data.OLD_SALARY_SCALE_ID) },
  { name: "OLD_BASIC_SALARY", type: sql.Decimal(15, 2), value: numOrNull(data.OLD_BASIC_SALARY) },
  { name: "OLD_FOT_ALLOWANCE", type: sql.Decimal(15, 2), value: numOrNull(data.OLD_FOT_ALLOWANCE) },
  { name: "OLD_ATTENDANCE_ALLOWANCE", type: sql.Decimal(15, 2), value: numOrNull(data.OLD_ATTENDANCE_ALLOWANCE) },
  { name: "OLD_ONE_1YP_ALLOWANCE", type: sql.Decimal(15, 2), value: numOrNull(data.OLD_ONE_1YP_ALLOWANCE) },
  { name: "OLD_TECHNICAL", type: sql.Decimal(15, 2), value: numOrNull(data.OLD_TECHNICAL) },
  { name: "OLD_POLYVALENT", type: sql.Decimal(15, 2), value: numOrNull(data.OLD_POLYVALENT) },
  { name: "OLD_RESPONSIBILITY", type: sql.Decimal(15, 2), value: numOrNull(data.OLD_RESPONSIBILITY) },
  { name: "OLD_LOYALTY", type: sql.Decimal(15, 2), value: numOrNull(data.OLD_LOYALTY) },
  { name: "OLD_PRODUCTIVITY", type: sql.Decimal(15, 2), value: numOrNull(data.OLD_PRODUCTIVITY) },
  { name: "OLD_CAPACITY", type: sql.Decimal(15, 2), value: numOrNull(data.OLD_CAPACITY) },
  { name: "OLD_DISCIPLINARY", type: sql.Decimal(15, 2), value: numOrNull(data.OLD_DISCIPLINARY) },
  { name: "OLD_HOUSE_ALLOW", type: sql.Decimal(15, 2), value: numOrNull(data.OLD_HOUSE_ALLOW) },
  { name: "OLD_MEDICIAL", type: sql.Decimal(15, 2), value: numOrNull(data.OLD_MEDICIAL) },
  { name: "OLD_EDUCATION", type: sql.Decimal(15, 2), value: numOrNull(data.OLD_EDUCATION) },
  { name: "OLD_MISCELLANIES", type: sql.Decimal(15, 2), value: numOrNull(data.OLD_MISCELLANIES) },
  { name: "OLD_NIGHT_ALLOWANCE", type: sql.Decimal(15, 2), value: numOrNull(data.OLD_NIGHT_ALLOWANCE) },
  { name: "OLD_EXTRA1", type: sql.Decimal(15, 2), value: numOrNull(data.OLD_EXTRA1) },
  { name: "OLD_EXTRA2", type: sql.Decimal(15, 2), value: numOrNull(data.OLD_EXTRA2) },
  { name: "OLD_EXTRA3", type: sql.Decimal(15, 2), value: numOrNull(data.OLD_EXTRA3) },
  { name: "OLD_EXTRA4", type: sql.Decimal(15, 2), value: numOrNull(data.OLD_EXTRA4) },
  { name: "OLD_EXTRA5", type: sql.Decimal(15, 2), value: numOrNull(data.OLD_EXTRA5) },
  { name: "OLD_EXTRA6", type: sql.Decimal(15, 2), value: numOrNull(data.OLD_EXTRA6) },
  { name: "OLD_GROSS_AMOUNT", type: sql.Decimal(15, 2), value: numOrNull(data.OLD_GROSS_AMOUNT) },

  { name: "NEW_COMPANY_ID", type: sql.Int, value: numOrNull(data.NEW_COMPANY_ID) },
  { name: "NEW_DEPARTMENT_ID", type: sql.Int, value: numOrNull(data.NEW_DEPARTMENT_ID) },
  { name: "NEW_DESIGNATION_ID", type: sql.Int, value: numOrNull(data.NEW_DESIGNATION_ID) },
  { name: "NEW_DEPARTMENT_GROUP_ID", type: sql.Int, value: numOrNull(data.NEW_DEPARTMENT_GROUP_ID) },
  { name: "NEW_DESIGNATION_GROUP_ID", type: sql.Int, value: numOrNull(data.NEW_DESIGNATION_GROUP_ID) },
  { name: "NEW_CAMP_ID", type: sql.Int, value: numOrNull(data.NEW_CAMP_ID) },
  { name: "NEW_STORE_ID", type: sql.Int, value: numOrNull(data.NEW_STORE_ID) },
  { name: "NEW_SALARY_SCALE_ID", type: sql.Int, value: numOrNull(data.NEW_SALARY_SCALE_ID) },
  { name: "NEW_BASIC_SALARY", type: sql.Decimal(15, 2), value: numOrNull(data.NEW_BASIC_SALARY) },
  { name: "NEW_FOT_ALLOWANCE", type: sql.Decimal(15, 2), value: numOrNull(data.NEW_FOT_ALLOWANCE) },
  { name: "NEW_ATTENDANCE_ALLOWANCE", type: sql.Decimal(15, 2), value: numOrNull(data.NEW_ATTENDANCE_ALLOWANCE) },
  { name: "NEW_ONE_1YP_ALLOWANCE", type: sql.Decimal(15, 2), value: numOrNull(data.NEW_ONE_1YP_ALLOWANCE) },
  { name: "NEW_TECHNICAL", type: sql.Decimal(15, 2), value: numOrNull(data.NEW_TECHNICAL) },
  { name: "NEW_POLYVALENT", type: sql.Decimal(15, 2), value: numOrNull(data.NEW_POLYVALENT) },
  { name: "NEW_RESPONSIBILITY", type: sql.Decimal(15, 2), value: numOrNull(data.NEW_RESPONSIBILITY) },
  { name: "NEW_LOYALTY", type: sql.Decimal(15, 2), value: numOrNull(data.NEW_LOYALTY) },
  { name: "NEW_PRODUCTIVITY", type: sql.Decimal(15, 2), value: numOrNull(data.NEW_PRODUCTIVITY) },
  { name: "NEW_CAPACITY", type: sql.Decimal(15, 2), value: numOrNull(data.NEW_CAPACITY) },
  { name: "NEW_DISCIPLINARY", type: sql.Decimal(15, 2), value: numOrNull(data.NEW_DISCIPLINARY) },
  { name: "NEW_HOUSE_ALLOW", type: sql.Decimal(15, 2), value: numOrNull(data.NEW_HOUSE_ALLOW) },
  { name: "NEW_MEDICIAL", type: sql.Decimal(15, 2), value: numOrNull(data.NEW_MEDICIAL) },
  { name: "NEW_EDUCATION", type: sql.Decimal(15, 2), value: numOrNull(data.NEW_EDUCATION) },
  { name: "NEW_MISCELLANIES", type: sql.Decimal(15, 2), value: numOrNull(data.NEW_MISCELLANIES) },
  { name: "NEW_NIGHT_ALLOWANCE", type: sql.Decimal(15, 2), value: numOrNull(data.NEW_NIGHT_ALLOWANCE) },
  { name: "NEW_EXTRA1", type: sql.Decimal(15, 2), value: numOrNull(data.NEW_EXTRA1) },
  { name: "NEW_EXTRA2", type: sql.Decimal(15, 2), value: numOrNull(data.NEW_EXTRA2) },
  { name: "NEW_EXTRA3", type: sql.Decimal(15, 2), value: numOrNull(data.NEW_EXTRA3) },
  { name: "NEW_EXTRA4", type: sql.Decimal(15, 2), value: numOrNull(data.NEW_EXTRA4) },
  { name: "NEW_EXTRA5", type: sql.Decimal(15, 2), value: numOrNull(data.NEW_EXTRA5) },
  { name: "NEW_EXTRA6", type: sql.Decimal(15, 2), value: numOrNull(data.NEW_EXTRA6) },
  { name: "NEW_GROSS_AMOUNT", type: sql.Decimal(15, 2), value: numOrNull(data.NEW_GROSS_AMOUNT) },

  { name: "NEW_APPROVED_MAN_POWER", type: sql.Int, value: numOrNull(data.NEW_APPROVED_MAN_POWER) },
  { name: "NEW_CURRENT_MAN_POWER", type: sql.Int, value: numOrNull(data.NEW_CURRENT_MAN_POWER) },
  { name: "NEW_PENDING_MAN_POWER", type: sql.Int, value: numOrNull(data.NEW_PENDING_MAN_POWER) },
  { name: "NEW_BALANCE_MAN_POWER", type: sql.Int, value: numOrNull(data.NEW_BALANCE_MAN_POWER) },

  { name: "REPORTING_MANAGER_ID", type: sql.Int, value: numOrNull(data.REPORTING_MANAGER_ID) },
  { name: "REPORTING_MANAGER_COMMENTS", type: sql.VarChar(1000), value: data.REPORTING_MANAGER_COMMENTS || null },
  { name: "MANAGER_RECOMMENDED_YN", type: sql.VarChar(10), value: data.MANAGER_RECOMMENDED_YN || null },
  { name: "REASON", type: sql.VarChar(3000), value: data.REASON || null },

  { name: "SECTION_HEAD_RESPONSE_PERSON_EMP_ID", type: sql.Int, value: null },
  { name: "SECTION_HEAD_RESPONSE_DATE", type: sql.DateTime, value: null },
  { name: "SECTION_HEAD_RESPONSE_STATUS", type: sql.VarChar(50), value: null },
  { name: "SECTION_HEAD_RESPONSE_REMARKS", type: sql.VarChar(50), value: null },

  { name: "REMARKS", type: sql.VarChar(1000), value: data.REMARKS || null },
  { name: "STATUS_MASTER", type: sql.VarChar(20), value: normalizeStatus(data.STATUS_MASTER) },
];

const applyInputs = (request: sql.Request, inputs: { name: string; type: any; value: any }[]) => {
  for (const input of inputs) {
    request.input(input.name, input.type, input.value);
  }
  return request;
};

const LIST_COLUMNS = `SNO,
    TRANSFER_REQUEST_REF_NO,
    MONTH_ENTERED,
    YEAR_ENTERED,
    TRANSFER_TYPE,
    EMP_ID,
    FIRST_NAME,
    MIDDLE_NAME,
    LAST_NAME,
    EMPLOYMENT_TYPE_ID,
    CURRENCY_ID,
    OLD_COMPANY_ID,
    OLD_DEPARTMENT_ID,
    OLD_DESIGNATION_ID,
    OLD_DEPARTMENT_GROUP_ID,
    OLD_DESIGNATION_GROUP_ID,
    OLD_CAMP_ID,
    OLD_STORE_ID,
    OLD_SALARY_SCALE_ID,
    OLD_BASIC_SALARY,
    OLD_FOT_ALLOWANCE,
    OLD_ATTENDANCE_ALLOWANCE,
    OLD_ONE_1YP_ALLOWANCE,
    OLD_TECHNICAL,
    OLD_POLYVALENT,
    OLD_RESPONSIBILITY,
    OLD_LOYALTY,
    OLD_PRODUCTIVITY,
    OLD_CAPACITY,
    OLD_DISCIPLINARY,
    OLD_HOUSE_ALLOW,
    OLD_MEDICIAL,
    OLD_EDUCATION,
    OLD_MISCELLANIES,
    OLD_NIGHT_ALLOWANCE,
    OLD_EXTRA1,
    OLD_EXTRA2,
    OLD_EXTRA3,
    OLD_EXTRA4,
    OLD_EXTRA5,
    OLD_EXTRA6,
    OLD_GROSS_AMOUNT,
    NEW_COMPANY_ID,
    NEW_DEPARTMENT_ID,
    NEW_DESIGNATION_ID,
    NEW_DEPARTMENT_GROUP_ID,
    NEW_DESIGNATION_GROUP_ID,
    NEW_CAMP_ID,
    NEW_STORE_ID,
    NEW_SALARY_SCALE_ID,
    NEW_BASIC_SALARY,
    NEW_FOT_ALLOWANCE,
    NEW_ATTENDANCE_ALLOWANCE,
    NEW_ONE_1YP_ALLOWANCE,
    NEW_TECHNICAL,
    NEW_POLYVALENT,
    NEW_RESPONSIBILITY,
    NEW_LOYALTY,
    NEW_PRODUCTIVITY,
    NEW_CAPACITY,
    NEW_DISCIPLINARY,
    NEW_HOUSE_ALLOW,
    NEW_MEDICIAL,
    NEW_EDUCATION,
    NEW_MISCELLANIES,
    NEW_NIGHT_ALLOWANCE,
    NEW_EXTRA1,
    NEW_EXTRA2,
    NEW_EXTRA3,
    NEW_EXTRA4,
    NEW_EXTRA5,
    NEW_EXTRA6,
    NEW_GROSS_AMOUNT,
    NEW_APPROVED_MAN_POWER,
    NEW_CURRENT_MAN_POWER,
    NEW_PENDING_MAN_POWER,
    NEW_BALANCE_MAN_POWER,
    REPORTING_MANAGER_ID,
    REPORTING_MANAGER_COMMENTS,
    MANAGER_RECOMMENDED_YN,
    REASON,
    REMARKS,
    STATUS_MASTER,
    CREATED_BY,
    CREATED_DATE,
    CREATED_MAC_ADDRESS,
    MODIFIED_BY,
    MODIFIED_DATE,
    MODIFIED_MAC_ADDRESS`;

export const getAllPromotionDemotionTransferRequestsService = async (
  status = "ALL",
  allowedCompanyIds?: number[]
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(20), status || "ALL")
      .query(`
        SELECT ${LIST_COLUMNS}
        FROM [VRequest].[TBL_PROMOTION_DEMOTION_TRANSFER_REQUEST]
        WHERE @STATUS = 'ALL' OR STATUS_MASTER = @STATUS
        ORDER BY SNO DESC
      `);
    let rows: any[] = result.recordset || [];
    if (Array.isArray(allowedCompanyIds) && allowedCompanyIds.length > 0) {
      const allowed = new Set(allowedCompanyIds.map(Number));
      rows = rows.filter(
        (r) => allowed.has(Number(r.OLD_COMPANY_ID)) || allowed.has(Number(r.NEW_COMPANY_ID))
      );
    }
    return rows.map((r) => ({ ...r, id: r.SNO }));
  } catch (error) {
    console.error("SHOW_PROMOTION_DEMOTION_TRANSFER_REQUEST list query error:", error);
    throw error;
  }
};

export const getPromotionDemotionTransferRequestByRefNoService = async (refNo: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("TRANSFER_REQUEST_REF_NO", sql.VarChar(50), refNo)
      .execute("VREQUEST.GET_PROMOTION_DEMOTION_TRANSFER_REQUEST");

    const row = result.recordset[0] || null;
    return row ? { ...row, id: row.SNO } : null;
  } catch (error) {
    console.error("GET_PROMOTION_DEMOTION_TRANSFER_REQUEST SP error:", error);
    throw error;
  }
};

export const savePromotionDemotionTransferRequestService = async (
  data: PromotionDemotionTransferRequestData
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const request = pool.request();
    applyInputs(request, getFieldInputs(data));
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

    const result = await request.execute("VREQUEST.SAVE_PROMOTION_DEMOTION_TRANSFER_REQUEST");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save promotion / demotion / transfer request");

    const sno = savedData !== undefined && savedData !== null && savedData !== ""
      ? Number(savedData)
      : undefined;

    return { message: message || "Data saved successfully", SNO: sno };
  } catch (error) {
    console.error("SAVE_PROMOTION_DEMOTION_TRANSFER_REQUEST SP error:", error);
    throw error;
  }
};

export const updatePromotionDemotionTransferRequestService = async (
  data: PromotionDemotionTransferRequestData
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const request = pool.request();
    request.input("SNO", sql.Int, data.SNO ?? 0);
    applyInputs(request, getFieldInputs(data));
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

    const result = await request.execute("VREQUEST.UPDATE_PROMOTION_DEMOTION_TRANSFER_REQUEST");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update promotion / demotion / transfer request");

    return { message: message || "Data updated successfully" };
  } catch (error) {
    console.error("UPDATE_PROMOTION_DEMOTION_TRANSFER_REQUEST SP error:", error);
    throw error;
  }
};

export const deletePromotionDemotionTransferRequestService = async (
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
      .input("TRANSFER_REQUEST_REF_NO", sql.VarChar(50), refNo)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VREQUEST.DELETE_PROMOTION_DEMOTION_TRANSFER_REQUEST");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete promotion / demotion / transfer request");

    return { message: message || "Data deleted successfully" };
  } catch (error) {
    console.error("DELETE_PROMOTION_DEMOTION_TRANSFER_REQUEST SP error:", error);
    throw error;
  }
};

export const submitPromotionDemotionTransferRequestService = async (
  refNo: string,
  role: string
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("TRANSFER_REQUEST_REF_NO", sql.VarChar(50), refNo)
      .input("ROLE", sql.VarChar(50), role || "Administrator")
      .execute("VMaster.SUBMIT_PROMOTION_DEMOTION_TRANSFER_REQUEST");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to submit promotion / demotion / transfer request");

    return { message: message || "Submitted successfully", STATUS_MASTER: "CL" };
  } catch (error) {
    console.error("SUBMIT_PROMOTION_DEMOTION_TRANSFER_REQUEST SP error:", error);
    throw error;
  }
};