import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface PromotionDemotionTransferEntriesData {
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

  FINAL_RESPONSE_EMP_ID?: number;
  FINAL_RESPONSE_DATE?: string;
  FINAL_RESPONSE_STATUS?: string;
  FINAL_RESPONSE_REMARKS?: string;

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

const getFieldInputs = (data: PromotionDemotionTransferEntriesData) => [
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

  { name: "SECTION_HEAD_RESPONSE_PERSON_EMP_ID", type: sql.Int, value: numOrNull(data.SECTION_HEAD_RESPONSE_PERSON_EMP_ID) },
  { name: "SECTION_HEAD_RESPONSE_DATE", type: sql.DateTime, value: data.SECTION_HEAD_RESPONSE_DATE || null },
  { name: "SECTION_HEAD_RESPONSE_STATUS", type: sql.VarChar(50), value: data.SECTION_HEAD_RESPONSE_STATUS || null },
  { name: "SECTION_HEAD_RESPONSE_REMARKS", type: sql.VarChar(50), value: data.SECTION_HEAD_RESPONSE_REMARKS || null },

  { name: "RESPONSE_1_EMP_ID", type: sql.Int, value: numOrNull(data.RESPONSE_1_EMP_ID) },
  { name: "RESPONSE_1_DATE", type: sql.DateTime, value: data.RESPONSE_1_DATE || null },
  { name: "RESPONSE_1_STATUS", type: sql.VarChar(50), value: data.RESPONSE_1_STATUS || null },
  { name: "RESPONSE_1_REMARKS", type: sql.VarChar(50), value: data.RESPONSE_1_REMARKS || null },

  { name: "RESPONSE_2_EMP_ID", type: sql.Int, value: numOrNull(data.RESPONSE_2_EMP_ID) },
  { name: "RESPONSE_2_DATE", type: sql.DateTime, value: data.RESPONSE_2_DATE || null },
  { name: "RESPONSE_2_STATUS", type: sql.VarChar(50), value: data.RESPONSE_2_STATUS || null },
  { name: "RESPONSE_2_REMARKS", type: sql.VarChar(50), value: data.RESPONSE_2_REMARKS || null },

  { name: "FINAL_RESPONSE_EMP_ID", type: sql.Int, value: numOrNull(data.FINAL_RESPONSE_EMP_ID) },
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

const LIST_COLUMNS = `T.SNO,
    T.TRANSFER_REQUEST_REF_NO,
    T.MONTH_ENTERED,
    T.YEAR_ENTERED,
    T.TRANSFER_TYPE,
    T.EMP_ID,
    T.FIRST_NAME,
    T.MIDDLE_NAME,
    T.LAST_NAME,
    T.EMPLOYMENT_TYPE_ID,
    T.CURRENCY_ID,
    T.OLD_COMPANY_ID,
    T.OLD_DEPARTMENT_ID,
    T.OLD_DESIGNATION_ID,
    T.OLD_DEPARTMENT_GROUP_ID,
    T.OLD_DESIGNATION_GROUP_ID,
    T.OLD_CAMP_ID,
    T.OLD_STORE_ID,
    T.OLD_SALARY_SCALE_ID,
    T.OLD_BASIC_SALARY,
    T.OLD_FOT_ALLOWANCE,
    T.OLD_ATTENDANCE_ALLOWANCE,
    T.OLD_ONE_1YP_ALLOWANCE,
    T.OLD_TECHNICAL,
    T.OLD_POLYVALENT,
    T.OLD_RESPONSIBILITY,
    T.OLD_LOYALTY,
    T.OLD_PRODUCTIVITY,
    T.OLD_CAPACITY,
    T.OLD_DISCIPLINARY,
    T.OLD_HOUSE_ALLOW,
    T.OLD_MEDICIAL,
    T.OLD_EDUCATION,
    T.OLD_MISCELLANIES,
    T.OLD_NIGHT_ALLOWANCE,
    T.OLD_EXTRA1,
    T.OLD_EXTRA2,
    T.OLD_EXTRA3,
    T.OLD_EXTRA4,
    T.OLD_EXTRA5,
    T.OLD_EXTRA6,
    T.OLD_GROSS_AMOUNT,
    T.NEW_COMPANY_ID,
    T.NEW_DEPARTMENT_ID,
    T.NEW_DESIGNATION_ID,
    T.NEW_DEPARTMENT_GROUP_ID,
    T.NEW_DESIGNATION_GROUP_ID,
    T.NEW_CAMP_ID,
    T.NEW_STORE_ID,
    T.NEW_SALARY_SCALE_ID,
    T.NEW_BASIC_SALARY,
    T.NEW_FOT_ALLOWANCE,
    T.NEW_ATTENDANCE_ALLOWANCE,
    T.NEW_ONE_1YP_ALLOWANCE,
    T.NEW_TECHNICAL,
    T.NEW_POLYVALENT,
    T.NEW_RESPONSIBILITY,
    T.NEW_LOYALTY,
    T.NEW_PRODUCTIVITY,
    T.NEW_CAPACITY,
    T.NEW_DISCIPLINARY,
    T.NEW_HOUSE_ALLOW,
    T.NEW_MEDICIAL,
    T.NEW_EDUCATION,
    T.NEW_MISCELLANIES,
    T.NEW_NIGHT_ALLOWANCE,
    T.NEW_EXTRA1,
    T.NEW_EXTRA2,
    T.NEW_EXTRA3,
    T.NEW_EXTRA4,
    T.NEW_EXTRA5,
    T.NEW_EXTRA6,
    T.NEW_GROSS_AMOUNT,
    T.NEW_APPROVED_MAN_POWER,
    T.NEW_CURRENT_MAN_POWER,
    T.NEW_PENDING_MAN_POWER,
    T.NEW_BALANCE_MAN_POWER,
    T.REPORTING_MANAGER_ID,
    T.REPORTING_MANAGER_COMMENTS,
    T.MANAGER_RECOMMENDED_YN,
    T.REASON,
    T.SECTION_HEAD_RESPONSE_PERSON_EMP_ID,
    T.SECTION_HEAD_RESPONSE_DATE,
    COALESCE(T.SECTION_HEAD_RESPONSE_STATUS, R.SECTION_HEAD_RESPONSE_STATUS) AS SECTION_HEAD_RESPONSE_STATUS,
    COALESCE(T.SECTION_HEAD_RESPONSE_REMARKS, R.SECTION_HEAD_RESPONSE_REMARKS) AS SECTION_HEAD_RESPONSE_REMARKS,
    T.RESPONSE_1_EMP_ID,
    T.RESPONSE_1_DATE,
    COALESCE(T.RESPONSE_1_STATUS, R.RESPONSE_1_STATUS) AS RESPONSE_1_STATUS,
    COALESCE(T.RESPONSE_1_REMARKS, R.RESPONSE_1_REMARKS) AS RESPONSE_1_REMARKS,
    T.RESPONSE_2_EMP_ID,
    T.RESPONSE_2_DATE,
    COALESCE(T.RESPONSE_2_STATUS, R.RESPONSE_2_STATUS) AS RESPONSE_2_STATUS,
    COALESCE(T.RESPONSE_2_REMARKS, R.RESPONSE_2_REMARKS) AS RESPONSE_2_REMARKS,
    T.FINAL_RESPONSE_EMP_ID,
    T.FINAL_RESPONSE_DATE,
    COALESCE(T.FINAL_RESPONSE_STATUS, R.FINAL_RESPONSE_STATUS) AS FINAL_RESPONSE_STATUS,
    COALESCE(T.FINAL_RESPONSE_REMARKS, R.FINAL_RESPONSE_REMARKS) AS FINAL_RESPONSE_REMARKS,
    T.REMARKS,
    T.STATUS_MASTER,
    T.CREATED_BY,
    T.CREATED_DATE,
    T.CREATED_MAC_ADDRESS,
    T.MODIFIED_BY,
    T.MODIFIED_DATE,
    T.MODIFIED_MAC_ADDRESS`;

export const getAllPromotionDemotionTransferEntriesService = async (
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
        SELECT ${LIST_COLUMNS}
        FROM [VPayEntries].[TBL_PROMOTION_DEMOTION_TRANSFER_ENTRIES] T
        LEFT JOIN [VREQUEST].[TBL_PROMOTION_DEMOTION_TRANSFER_REQUEST] R ON R.TRANSFER_REQUEST_REF_NO = T.TRANSFER_REQUEST_REF_NO
        WHERE (@STATUS = 'ALL' OR T.STATUS_MASTER = @STATUS)
          AND (@FROM_DATE IS NULL OR CAST(T.CREATED_DATE AS DATE) >= CAST(@FROM_DATE AS DATE))
          AND (@TO_DATE IS NULL OR CAST(T.CREATED_DATE AS DATE) <= CAST(@TO_DATE AS DATE))
        ORDER BY T.SNO DESC
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
    console.error("SHOW_PROMOTION_DEMOTION_TRANSFER_ENTRIES list query error:", error);
    throw error;
  }
};

export const getPromotionDemotionTransferEntryByRefNoService = async (refNo: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("TRANSFER_REQUEST_REF_NO", sql.VarChar(50), refNo)
      .query(`
        SELECT ${LIST_COLUMNS}
        FROM [VPayEntries].[TBL_PROMOTION_DEMOTION_TRANSFER_ENTRIES] T
        LEFT JOIN [VREQUEST].[TBL_PROMOTION_DEMOTION_TRANSFER_REQUEST] R ON R.TRANSFER_REQUEST_REF_NO = T.TRANSFER_REQUEST_REF_NO
        WHERE T.TRANSFER_REQUEST_REF_NO = @TRANSFER_REQUEST_REF_NO
      `);

    const row = result.recordset[0] || null;
    return row ? { ...row, id: row.SNO } : null;
  } catch (error) {
    console.error("GET_PROMOTION_DEMOTION_TRANSFER_ENTRIES query error:", error);
    throw error;
  }
};

export const savePromotionDemotionTransferEntriesService = async (
  data: PromotionDemotionTransferEntriesData
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const request = pool.request();
    applyInputs(request, getFieldInputs(data));
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

    const result = await request.execute("VPayEntries.SAVE_PROMOTION_DEMOTION_TRANSFER_ENTRIES");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save promotion / demotion / transfer entry");

    const sno = savedData !== undefined && savedData !== null && savedData !== ""
      ? Number(savedData)
      : undefined;

    return { message: message || "Data saved successfully", SNO: sno };
  } catch (error) {
    console.error("SAVE_PROMOTION_DEMOTION_TRANSFER_ENTRIES SP error:", error);
    throw error;
  }
};

export const updatePromotionDemotionTransferEntriesService = async (
  data: PromotionDemotionTransferEntriesData
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const request = pool.request();
    request.input("SNO", sql.Int, data.SNO ?? 0);
    applyInputs(request, getFieldInputs(data));
    request.input("USER", sql.VarChar(50), data.USER || "Admin");
    request.input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

    const result = await request.execute("VPayEntries.UPDATE_PROMOTION_DEMOTION_TRANSFER_ENTRIES");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update promotion / demotion / transfer entry");

    return { message: message || "Data updated successfully" };
  } catch (error) {
    console.error("UPDATE_PROMOTION_DEMOTION_TRANSFER_ENTRIES SP error:", error);
    throw error;
  }
};

export const submitPromotionDemotionTransferEntriesService = async (refNo: string, role = "Administrator") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("TRANSFER_REQUEST_REF_NO", sql.VarChar(50), refNo)
      .input("Role", sql.VarChar(50), role || "Administrator")
      .execute("VPayEntries.SUBMIT_PROMOTION_DEMOTION_TRANSFER_ENTRIES");

    const row = result.recordset?.[0];
    const text = row ? Object.values(row).join("") : "";
    const output = String(text || "").trim();

    if (/error|not found|already|invalid/i.test(output)) {
      throw new Error(output || "Failed to submit promotion / demotion / transfer entries");
    }

    return {
      status: "",
      message: output.includes("Submitted Successfully")
        ? "Promotion / demotion / transfer entries submitted successfully"
        : output || "Promotion / demotion / transfer entries submitted successfully",
    };
  } catch (error) {
    console.error("SUBMIT_PROMOTION_DEMOTION_TRANSFER_ENTRIES SP error:", error);
    throw error;
  }
};

export const deletePromotionDemotionTransferEntriesService = async (
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
      .execute("VPayEntries.DELETE_PROMOTION_DEMOTION_TRANSFER_ENTRIES");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete promotion / demotion / transfer entry");

    return { message: message || "Data deleted successfully" };
  } catch (error) {
    console.error("DELETE_PROMOTION_DEMOTION_TRANSFER_ENTRIES SP error:", error);
    throw error;
  }
};