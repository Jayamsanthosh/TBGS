import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

/**
 * Slug (URL param) -> exact SP request-type string.
 * The frontend routes use '/attendance' and '/cash-advance'.
 */
export const REQUEST_TYPE_MAP: Record<string, string> = {
  attendance: "Attendance Request",
  "attendance-request": "Attendance Request",
  "cash-advance": "Cash Advance Request",
  "cash-advance-request": "Cash Advance Request",
  arrears: "Arrears Request",
  "arrears-request": "Arrears Request",
  overtime: "Overtime Request",
  "overtime-request": "Overtime Request",
  bonus: "Bonus Request",
  "bonus-request": "Bonus Request",
  "leave-encashment": "Leave Encashment Request",
  "leave-encashment-request": "Leave Encashment Request",
  "promotion-demotion-transfer": "Promotion Demotion Transfer Request",
  "promotion-demotion-transfer-request": "Promotion Demotion Transfer Request",
};

/** Request type -> table. All tables share the same approval-status columns. */
const REQUEST_TABLE_MAP: Record<string, string> = {
  "Attendance Request": "TBL_ATTENDANCE_REQUEST",
  "Cash Advance Request": "TBL_CASH_ADVANCE_REQUEST",
  "Arrears Request": "TBL_ARREARS_REQUEST",
  "Overtime Request": "TBL_OVERTIME_REQUEST",
  "Bonus Request": "TBL_BONUS_REQUEST",
  "Leave Encashment Request": "TBL_LEAVE_ENCASHMENT_REQUEST",
  "Promotion Demotion Transfer Request": "TBL_PROMOTION_DEMOTION_TRANSFER_REQUEST",
};

/**
 * Mirror the exact "is there a pending/held level" logic of UPDATE_REQUEST_STATUS
 * so a bulk status update is validated BEFORE any row is written (all-or-nothing).
 * Returns the subset of `ids` that cannot be actioned right now.
 */
export const validateActionableRequests = async (
  requestType: string,
  ids: number[]
): Promise<number[]> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const table = REQUEST_TABLE_MAP[requestType];
  const idList = (ids || []).map(Number).filter((n) => Number.isFinite(n));
  if (!table || idList.length === 0) return idList;

  const norm = (v: string): string =>
    v === "APPROVAL" ? "APPROVED" : v === "REJECT" ? "REJECTED" : v;

  const result = await pool.request().query(`
    SELECT SNO,
      UPPER(ISNULL(STATUS_MASTER, '')) AS sm,
      UPPER(ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)), ''), 'PENDING')) AS sh,
      UPPER(ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)), ''), 'PENDING')) AS r1,
      UPPER(ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)), ''), 'PENDING')) AS r2,
      UPPER(ISNULL(NULLIF(LTRIM(RTRIM(FINAL_RESPONSE_STATUS)), ''), 'PENDING')) AS fin
    FROM [VREQUEST].[${table}]
    WHERE SNO IN (${idList.join(",")})`);

  const seen = new Set<number>();
  const nonActionable: number[] = [];
  for (const row of result.recordset || []) {
    const sno = Number(row.SNO);
    seen.add(sno);
    // STATUS_MASTER lifecycle truth: terminal rows can never be actioned.
    // 'CL' (submitted) is NOT terminal — it must remain approvable.
    const smTerminal = ["APPROVED", "REJECTED", "CLOSED"].includes(String(row.sm || ""));
    const sh = norm(row.sh), r1 = norm(row.r1), r2 = norm(row.r2), fin = norm(row.fin);
    // A HELD level is re-actionable at the same level (mirrors UPDATE_REQUEST_STATUS).
    const actionable =
      sh === "PENDING" || sh === "HOLD" ||
      (sh === "APPROVED" && (r1 === "PENDING" || r1 === "HOLD")) ||
      (r1 === "APPROVED" && (r2 === "PENDING" || r2 === "HOLD")) ||
      (r2 === "APPROVED" && (fin === "PENDING" || fin === "HOLD"));
    if (smTerminal || !actionable) nonActionable.push(sno);
  }
  // Ids that don't exist in the table at all are also not actionable.
  for (const id of idList) if (!seen.has(id)) nonActionable.push(id);

  return nonActionable;
};

export const resolveRequestType = (slug: string): string | null =>
  REQUEST_TYPE_MAP[String(slug || "").toLowerCase()] || null;

/** Frontend status tokens -> SP status values (null = no-op / invalid). */
export const mapApprovalStatus = (status: string): string | null => {
  const s = String(status || "").trim().toLowerCase();
  if (s === "approved" || s === "approve" || s === "approval") return "Approved";
  if (s === "rejected" || s === "reject") return "Reject";
  if (s === "hold") return "Hold";
  return null;
};

/** The SP now returns frontend-ready camelCase rows; only add the `id` alias. */
const mapRowToFrontend = (_requestType: string, r: any) => ({
  ...r,
  id: r.sno ?? r.SNO,
});

/** Summary rows: CardName, PendingCount, ApprovedCount, HoldCount, RejectedCount. */
export const getApprovalSummaryService = async (): Promise<any[]> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  const result = await pool.request().execute("VRequest.GET_REQUEST_SUMMARY");
  return result.recordset || [];
};

/** List rows for one request type, optionally filtered by canonical status. */
export const getRequestListService = async (
  requestType: string,
  status = "ALL"
): Promise<any[]> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const result = await pool
    .request()
    .input("RequestType", sql.VarChar(100), requestType)
    .input("Status", sql.VarChar(50), status || "ALL")
    .execute("VRequest.GET_REQUEST_LIST_BY_TYPE");

  const rows = (result.recordset || []).map((r) => mapRowToFrontend(requestType, r));
  return await attachDisplayNames(pool, rows);
};

export interface RequestListPageFilter {
  fromDate?: string | null;
  toDate?: string | null;
  companyId?: string | number | null;
  storeId?: string | number | null;
  campId?: string | number | null;
  departmentId?: string | number | null;
  search?: string | null;
  page?: number | null;
  pageSize?: number | null;
}

/**
 * Paged list rows for one request type with optional server-side filters.
 * The SP returns "Total + page rows" (two result sets) when paging is
 * requested; it falls back to the legacy single result-set otherwise.
 */
export const getRequestPageService = async (
  requestType: string,
  status = "ALL",
  filter: RequestListPageFilter = {}
): Promise<{ total: number; rows: any[] }> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const toNullableInt = (v: string | number | null | undefined): number | null => {
    if (v == null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const toNullablePage = (v: number | null | undefined): number | null =>
    v == null || !Number.isFinite(v) || v < 1 ? null : Math.floor(v);

  const result = await pool
    .request()
    .input("RequestType", sql.VarChar(100), requestType)
    .input("Status", sql.VarChar(50), status || "ALL")
    .input("FromDate", sql.Date, filter.fromDate || null)
    .input("ToDate", sql.Date, filter.toDate || null)
    .input("CompanyId", sql.Int, toNullableInt(filter.companyId))
    .input("StoreId", sql.Int, toNullableInt(filter.storeId))
    .input("CampId", sql.Int, toNullableInt(filter.campId))
    .input("DepartmentId", sql.Int, toNullableInt(filter.departmentId))
    .input("Search", sql.NVarChar(200), filter.search || null)
    .input("Page", sql.Int, toNullablePage(filter.page))
    .input("PageSize", sql.Int, toNullablePage(filter.pageSize))
    .execute("VRequest.GET_REQUEST_LIST_BY_TYPE");

  const recordsets = (result.recordsets || []) as any[][];
  if (recordsets.length >= 2) {
    const rows = (recordsets[1] || []).map((r) => mapRowToFrontend(requestType, r));
    const total = Number(recordsets[0]?.[0]?.Total ?? 0);
    return { total, rows: await attachDisplayNames(pool, rows) };
  }
  const rows = (recordsets[0] || []).map((r) => mapRowToFrontend(requestType, r));
  return { total: rows.length, rows: await attachDisplayNames(pool, rows) };
};

/**
 * Best-effort display-name resolution for the raw id columns returned by the
 * list SP (COMPANY_ID / DEPARTMENT_ID / STORE_ID). Attaches companyName,
 * departmentName and storeName onto every row without failing the request.
 */
const attachDisplayNames = async (pool: any, rows: any[]): Promise<any[]> => {
  if (!rows || rows.length === 0) return rows;

  const collectIds = (field: string): number[] =>
    Array.from(
      new Set(rows.map((r) => Number(r[field])).filter((n) => Number.isFinite(n)))
    );

  const lookup = async (
    table: string,
    idCol: string,
    nameCol: string,
    ids: number[]
  ): Promise<Map<number, string>> => {
    if (ids.length === 0) return new Map();
    const res = await pool
      .request()
      .query(
        `SELECT ${idCol}, ${nameCol} FROM VMaster.${table} WHERE ${idCol} IN (${ids.join(",")})`
      );
    return new Map<number, string>(
      (res.recordset || []).map((r: any) => [Number(r[idCol]), String(r[nameCol] ?? "")])
    );
  };

  try {
    const [companies, departments, stores, currencies] = await Promise.all([
      lookup("TBL_COMPANY_MASTER", "COMPANY_ID", "COMPANY_NAME", collectIds("COMPANY_ID")),
      lookup("TBL_DEPARTMENT_MASTER", "DEPARTMENT_ID", "DEPARTMENT_NAME", collectIds("DEPARTMENT_ID")),
      lookup("TBL_STORE_MASTER", "STORE_ID", "STORE_NAME", collectIds("STORE_ID")),
      lookup("TBL_CURRENCY_MASTER", "CURRENCY_ID", "CURRENCY_NAME", collectIds("CURRENCY_ID")),
    ]);

    for (const row of rows) {
      const companyId = Number(row.COMPANY_ID);
      const departmentId = Number(row.DEPARTMENT_ID);
      const storeId = Number(row.STORE_ID);
      const currencyId = Number(row.CURRENCY_ID);
      if (Number.isFinite(companyId)) row.companyName = companies.get(companyId) ?? row.companyName ?? null;
      if (Number.isFinite(departmentId)) row.departmentName = departments.get(departmentId) ?? row.departmentName ?? null;
      if (Number.isFinite(storeId)) row.storeName = stores.get(storeId) ?? row.storeName ?? null;
      if (Number.isFinite(currencyId)) row.currencyName = currencies.get(currencyId) ?? row.currencyName ?? null;
    }
  } catch (error: any) {
    console.error("Attachment of display names failed:", error?.message);
  }

  return rows;
};

/** Normalise any stored status token to the canonical frontend badge set. */
const normalizeStatus = (value: unknown): string => {
  const s = String(value ?? "").trim().toUpperCase();
  if (!s) return "PENDING";
  if (s === "APPROVAL" || s === "APPROVED") return "APPROVED";
  if (s === "REJECT" || s === "REJECTED") return "REJECTED";
  return s;
};

/** Single record detail (row + display aliases for the raw UPPERCASE columns). */
export const getRequestDetailService = async (
  requestType: string,
  sno: number
): Promise<any | null> => {
  const rows = await getRequestListService(requestType, "ALL");
  const row = rows.find((r: any) => Number(r.sno ?? r.SNO) === Number(sno));
  if (!row) return null;

  // Effective status = latest non-empty level in the approval cascade
  // (FINAL -> RESPONSE_2 -> RESPONSE_1 -> SECTION_HEAD). A level-1 approval
  // writes SECTION_HEAD_RESPONSE_STATUS only, so the badge must cascade.
  const firstSetStatus = [
    row.FINAL_RESPONSE_STATUS,
    row.RESPONSE_2_STATUS,
    row.RESPONSE_1_STATUS,
    row.SECTION_HEAD_RESPONSE_STATUS,
  ]
    .map((v: unknown) => String(v ?? "").trim())
    .find((v: string) => v !== "");

  return {
    ...row,
    files: [],
    productLineItems: [],
    additionalCosts: [],
    supplier: {},
    company: row.companyName ? { companyName: row.companyName } : {},
    store: row.storeName ? { storeName: row.storeName } : {},
    // Display aliases
    poRefNo:
      row.poRefNo ||
      row.ATT_REQUEST_REF_NO ||
      row.CASH_ADV_REQUEST_REF_NO ||
      row.ARREAR_REQUEST_REF_NO ||
      row.OT_REQUEST_REF_NO ||
      row.BONUS_REQUEST_REF_NO ||
      row.LEAVE_ENCASHMENT_REQUEST_REF_NO ||
      row.TRANSFER_REQUEST_REF_NO ||
      null,
    requestedBy: row.requestedBy || row.FIRST_NAME || row.EMP_ID || null,
    requestedDate: row.CREATED_DATE ?? null,
    createdDate: row.createdDate ?? row.CREATED_DATE ?? null,
    amount: row.amount ?? row.REQUEST_AMOUNT ?? row.NO_OF_DAYS ?? null,
    currencyType: row.currencyName || "TZS",
    response1Status: normalizeStatus(row.RESPONSE_1_STATUS),
    response1Person: row.response1Person ?? row.RESPONSE_1_EMP_ID ?? null,
    response1Remarks: row.REMARKS ?? null,
    response2Status: normalizeStatus(row.RESPONSE_2_STATUS),
    response2Person: row.response2Person ?? row.RESPONSE_2_EMP_ID ?? null,
    response2Remarks: row.REMARKS ?? null,
    finalResponseStatus: normalizeStatus(firstSetStatus),
  };
};

/** Update a single request's approval status via UPDATE_REQUEST_STATUS. */
export const updateRequestStatusService = async (params: {
  requestType: string;
  sno: number;
  status: string;
  updatedBy: string;
  holdReason?: string;
}): Promise<{ message: string; data?: any }> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const result = await pool
    .request()
    .input("RequestID", sql.Int, params.sno)
    .input("RequestType", sql.VarChar(100), params.requestType)
    .input("Status", sql.VarChar(50), params.status)
    .input("UpdatedBy", sql.VarChar(50), params.updatedBy || "Admin")
    .input("HoldReason", sql.VarChar(1000), params.holdReason || null)
    .execute("VRequest.UPDATE_REQUEST_STATUS");

  const parsed = parseSprocResult(result.recordset?.[0], "Failed to update request status");

  return { message: parsed.message || "Status updated successfully", data: parsed.data };
};