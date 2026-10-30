import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";
import { getAllDocumentsService, getDocumentByIdService } from "./dms.services";

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
  /* Purchase Request and Purchase Quotation are the non-HR types in the panel.
     Each has its own approval procs because its header table stores the
     workflow in SECTION_HEAD_/RESPONSE_1_/RESPONSE_2_ columns under VPurchase
     instead of the STATUS_MASTER-driven tables the request types above share. */
  "purchase-request": "Purchase Request",
  "purchase-requests": "Purchase Request",
  "purchase-request-approval": "Purchase Request",
  "purchase_request": "Purchase Request",
  "purchase request": "Purchase Request",
  "purchase-quotation": "Purchase Quotation",
  "purchase-quotations": "Purchase Quotation",
  "purchase-quotation-approval": "Purchase Quotation",
  "purchase_quotation": "Purchase Quotation",
  "purchase quotation": "Purchase Quotation",
  /* Purchase Order is the last step of the same purchase flow: it is raised
     against a submitted quotation and approved by the same three levels. */
  "purchase-order": "Purchase Order",
  "purchase-orders": "Purchase Order",
  "purchase-order-approval": "Purchase Order",
  "purchase_order": "Purchase Order",
  "purchase order": "Purchase Order",
};

/** Request types whose approval flow is driven by their own procedures. */
export const PURCHASE_REQUEST_TYPE = "Purchase Request";
export const PURCHASE_QUOTATION_TYPE = "Purchase Quotation";
export const PURCHASE_ORDER_TYPE = "Purchase Order";

const isPurchaseRequest = (requestType: string): boolean =>
  requestType === PURCHASE_REQUEST_TYPE;

const isPurchaseQuotation = (requestType: string): boolean =>
  requestType === PURCHASE_QUOTATION_TYPE;

const isPurchaseOrder = (requestType: string): boolean =>
  requestType === PURCHASE_ORDER_TYPE;

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
  if (idList.length === 0) return idList;

  const norm = (v: string): string =>
    v === "APPROVAL" ? "APPROVED" : v === "REJECT" ? "REJECTED" : v;

  /* Purchase Request: its header has no STATUS_MASTER lifecycle column, and the
     chain has three levels (Section Head -> Response 1 -> Response 2) with no
     separate FINAL level - the final outcome is mirrored into
     FINAL_RESPONSE_STATUS by the update proc. STATUS_ENTRY = 'CL' means
     "submitted for approval" and is NOT terminal. */
  if (isPurchaseRequest(requestType)) {
    const result = await pool.request().query(`
      SELECT SNO,
        UPPER(ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)), ''), 'PENDING')) AS sh,
        UPPER(ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)), ''), 'PENDING')) AS r1,
        UPPER(ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)), ''), 'PENDING')) AS r2,
        UPPER(LTRIM(RTRIM(ISNULL(STATUS_ENTRY, '')))) AS se
      FROM [VPurchase].[TBL_PURCHASE_REQUEST_HDR]
      WHERE SNO IN (${idList.join(",")})`);

    const seen = new Set<number>();
    const nonActionable: number[] = [];
    for (const row of result.recordset || []) {
      const sno = Number(row.SNO);
      seen.add(sno);
      const sh = norm(row.sh), r1 = norm(row.r1), r2 = norm(row.r2);
      const submitted = String(row.se || "") === "CL";
      const actionable =
        submitted &&
        (sh === "PENDING" || sh === "HOLD" ||
          (sh === "APPROVED" && (r1 === "PENDING" || r1 === "HOLD")) ||
          (r1 === "APPROVED" && (r2 === "PENDING" || r2 === "HOLD")));
      if (!actionable) nonActionable.push(sno);
    }
    // Ids that don't exist (or are still drafts) are also not actionable.
    for (const id of idList) if (!seen.has(id)) nonActionable.push(id);

    return nonActionable;
  }

  /* Purchase Quotation: same three-level chain, but the header stores the
     workflow state in QUOTATION_STATUS_ID (2 Draft, 3 Pending, 4 Approved)
     instead of STATUS_ID. That column is a Purchase-Order gate rather than a
     level, so it is only used to recognise a quotation that the final approval
     already completed - the level columns decide everything else. */
  if (isPurchaseQuotation(requestType)) {
    const result = await pool.request().query(`
      SELECT SNO,
        ISNULL(QUOTATION_STATUS_ID, 0) AS qsid,
        UPPER(ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)), ''), 'PENDING')) AS sh,
        UPPER(ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)), ''), 'PENDING')) AS r1,
        UPPER(ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)), ''), 'PENDING')) AS r2,
        UPPER(LTRIM(RTRIM(ISNULL(STATUS_ENTRY, '')))) AS se
      FROM [VPurchase].[TBL_PURCHASE_QUOTATION_HDR]
      WHERE SNO IN (${idList.join(",")})`);

    const seen = new Set<number>();
    const nonActionable: number[] = [];
    for (const row of result.recordset || []) {
      const sno = Number(row.SNO);
      seen.add(sno);
      const sh = norm(row.sh), r1 = norm(row.r1), r2 = norm(row.r2);
      const submitted = String(row.se || "") === "CL";
      const completed = Number(row.qsid) === 4;
      const actionable =
        submitted &&
        !completed &&
        (sh === "PENDING" || sh === "HOLD" ||
          (sh === "APPROVED" && (r1 === "PENDING" || r1 === "HOLD")) ||
          (r1 === "APPROVED" && (r2 === "PENDING" || r2 === "HOLD")));
      if (!actionable) nonActionable.push(sno);
    }
    // Ids that don't exist (or are still drafts) are also not actionable.
    for (const id of idList) if (!seen.has(id)) nonActionable.push(id);

    return nonActionable;
  }

  /* Purchase Order: same three-level chain as Request / Quotation. The header
     carries PURCHASE_ORDER_STATUS_ID purely as a lifecycle column (2 Draft,
     3 Pending, 4 Approved, 5 Rejected, 6 Cancelled, 7 Closed), so a row that
     the final approval already completed is not actionable even if a legacy
     level column was left pending. */
  if (isPurchaseOrder(requestType)) {
    const result = await pool.request().query(`
      SELECT SNO,
        ISNULL(PURCHASE_ORDER_STATUS_ID, 0) AS posid,
        UPPER(ISNULL(NULLIF(LTRIM(RTRIM(SECTION_HEAD_RESPONSE_STATUS)), ''), 'PENDING')) AS sh,
        UPPER(ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_1_STATUS)), ''), 'PENDING')) AS r1,
        UPPER(ISNULL(NULLIF(LTRIM(RTRIM(RESPONSE_2_STATUS)), ''), 'PENDING')) AS r2,
        UPPER(LTRIM(RTRIM(ISNULL(STATUS_ENTRY, '')))) AS se
      FROM [VPurchase].[TBL_PURCHASE_ORDER_HDR]
      WHERE SNO IN (${idList.join(",")})`);

    const seen = new Set<number>();
    const nonActionable: number[] = [];
    for (const row of result.recordset || []) {
      const sno = Number(row.SNO);
      seen.add(sno);
      const sh = norm(row.sh), r1 = norm(row.r1), r2 = norm(row.r2);
      const submitted = String(row.se || "") === "CL";
      const completed = [4, 5, 6, 7].includes(Number(row.posid));
      const actionable =
        submitted &&
        !completed &&
        (sh === "PENDING" || sh === "HOLD" ||
          (sh === "APPROVED" && (r1 === "PENDING" || r1 === "HOLD")) ||
          (r1 === "APPROVED" && (r2 === "PENDING" || r2 === "HOLD")));
      if (!actionable) nonActionable.push(sno);
    }
    // Ids that don't exist (or are still drafts) are also not actionable.
    for (const id of idList) if (!seen.has(id)) nonActionable.push(id);

    return nonActionable;
  }

  if (!table) return idList;

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

/**
 * Summary rows: CardName, PendingCount, ApprovedCount, HoldCount, RejectedCount.
 *
 * The seven HR request types come from VRequest.GET_REQUEST_SUMMARY; the two
 * purchase types have their own header tables and status rollups, so their
 * cards are merged in from VRequest.GET_PURCHASE_REQUEST_SUMMARY and
 * VRequest.GET_PURCHASE_QUOTATION_SUMMARY. Keeping them separate means the
 * seven-type proc is never rewritten just to add one card.
 */
export const getApprovalSummaryService = async (): Promise<any[]> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const [requests, purchaseRequests, purchaseQuotations, purchaseOrders] = await Promise.all([
    pool.request().execute("VRequest.GET_REQUEST_SUMMARY"),
    pool.request().execute("VRequest.GET_PURCHASE_REQUEST_SUMMARY"),
    pool.request().execute("VRequest.GET_PURCHASE_QUOTATION_SUMMARY"),
    pool.request().execute("VRequest.GET_PURCHASE_ORDER_SUMMARY"),
  ]);

  return [
    ...(requests.recordset || []),
    ...(purchaseRequests.recordset || []),
    ...(purchaseQuotations.recordset || []),
    ...(purchaseOrders.recordset || []),
  ];
};

/** List rows for one request type, optionally filtered by canonical status. */
export const getRequestListService = async (
  requestType: string,
  status = "ALL"
): Promise<any[]> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  if (isPurchaseRequest(requestType)) {
    // The PR list proc already joins every master (company / store / camp /
    // branch / type / priority / requester names) and returns camelCase, so no
    // display-name attachment pass is needed.
    const result = await pool
      .request()
      .input("Status", sql.VarChar(50), status || "ALL")
      .execute("VPurchase.GET_APPROVAL_LIST_PURCHASE_REQUEST");

    return (result.recordset || []).map((r) => mapRowToFrontend(requestType, r));
  }

  if (isPurchaseQuotation(requestType)) {
    // Same contract as PR: the PQ proc joins the masters (company / store /
    // branch / camp / supplier / currency) and returns camelCase.
    const result = await pool
      .request()
      .input("Status", sql.VarChar(50), status || "ALL")
      .execute("VPurchase.GET_APPROVAL_LIST_PURCHASE_QUOTATION");

    return (result.recordset || []).map((r) => mapRowToFrontend(requestType, r));
  }

  if (isPurchaseOrder(requestType)) {
    // Same contract again: the PO proc joins company / store / branch / camp /
    // supplier / currency and the quotation + request references it came from.
    const result = await pool
      .request()
      .input("Status", sql.VarChar(50), status || "ALL")
      .execute("VPurchase.GET_APPROVAL_LIST_PURCHASE_ORDER");

    return (result.recordset || []).map((r) => mapRowToFrontend(requestType, r));
  }

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

  const request = pool
    .request()
    .input("Status", sql.VarChar(50), status || "ALL")
    .input("FromDate", sql.Date, filter.fromDate || null)
    .input("ToDate", sql.Date, filter.toDate || null)
    .input("CompanyId", sql.Int, toNullableInt(filter.companyId))
    .input("StoreId", sql.Int, toNullableInt(filter.storeId))
    .input("CampId", sql.Int, toNullableInt(filter.campId))
    .input("DepartmentId", sql.Int, toNullableInt(filter.departmentId))
    .input("Search", sql.NVarChar(200), filter.search || null)
    .input("Page", sql.Int, toNullablePage(filter.page))
    .input("PageSize", sql.Int, toNullablePage(filter.pageSize));

  const purchaseRequest = isPurchaseRequest(requestType);
  const purchaseQuotation = isPurchaseQuotation(requestType);
  const purchaseOrder = isPurchaseOrder(requestType);
  const purchaseType = purchaseRequest || purchaseQuotation || purchaseOrder;
  if (!purchaseType) {
    request.input("RequestType", sql.VarChar(100), requestType);
  }

  const result = await request.execute(
    purchaseOrder
      ? "VPurchase.GET_APPROVAL_LIST_PURCHASE_ORDER"
      : purchaseQuotation
        ? "VPurchase.GET_APPROVAL_LIST_PURCHASE_QUOTATION"
        : purchaseRequest
          ? "VPurchase.GET_APPROVAL_LIST_PURCHASE_REQUEST"
          : "VRequest.GET_REQUEST_LIST_BY_TYPE"
  );

  const withNames = async (rows: any[]) =>
    purchaseType ? rows : attachDisplayNames(pool, rows);

  const recordsets = (result.recordsets || []) as any[][];
  if (recordsets.length >= 2) {
    const rows = (recordsets[1] || []).map((r) => mapRowToFrontend(requestType, r));
    const total = Number(recordsets[0]?.[0]?.Total ?? 0);
    return { total, rows: await withNames(rows) };
  }
  const rows = (recordsets[0] || []).map((r) => mapRowToFrontend(requestType, r));
  return { total: rows.length, rows: await withNames(rows) };
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

/**
 * First non-blank value. Used instead of `??` so an empty SP alias cannot
 * shadow a populated raw column (and vice versa).
 */
const firstNonEmpty = (...values: unknown[]): any => {
  for (const value of values) {
    if (value !== null && value !== undefined && String(value).trim() !== "") return value;
  }
  return null;
};

/**
 * Purchase Request lines, shaped for the detail panel.
 *
 * SHOW_PURCHASE_REQUEST_DTL returns UPPERCASE columns; the panel works in
 * camelCase, so every field is aliased here. totalPcs/orderedQty keep the
 * names the PDF export already reads.
 */
const getPurchaseRequestLineItems = async (pool: any, refNo: string): Promise<any[]> => {
  if (!refNo) return [];

  const result = await pool
    .request()
    .input("PURCHASE_REQUEST_NO", sql.VarChar(50), refNo)
    .execute("VPurchase.SHOW_PURCHASE_REQUEST_DTL");

  return (result.recordset || []).map((d: any) => ({
    id: d.ID ?? d.PURCHASE_REQUEST_DTL_ID,
    lineNo: d.LINE_NO,
    referenceTypeName: d.REFERENCE_TYPE_NAME,
    referenceNo: d.REFERENCE_NO,
    mainCategoryName: d.MAIN_CATEGORY_NAME,
    subCategoryName: d.SUB_CATEGORY_NAME,
    productId: d.PRODUCT_ID,
    productName: d.PRODUCT_NAME,
    description: d.DESCRIPTION,
    noOfPcsPerPacking: d.NO_OF_PCS_PER_PACKING,
    totalQuantity: d.Total_Quantity,
    orderedQty: d.Total_Quantity,
    uomId: d.UOM_ID,
    uomName: d.UOM_NAME,
    totalPacking: d.Total_Packing,
    truckNo: d.TRUCK_NO,
    requiredDate: d.REQUIRED_DATE,
    reason: d.REASON,
  }));
};

/**
 * Purchase Quotation header, lines and additional charges, shaped for the
 * detail panel and the expansion cards.
 *
 * The header table (TBL_PURCHASE_QUOTATION_HDR) has no STATUS_ID and no CAMP_ID:
 * the workflow state is QUOTATION_STATUS_ID and the camp sits on the lines. The
 * read proc only filters by status, so the requested row is picked out of the
 * full SHOW_PURCHASE_QUOTATION_HDR result by quotation number.
 *
 * Quotation lines are stored with STATUS_ENTRY = 'AC', which is not a draft
 * marker for this table - the entry screen writes 'AC' on every saved line - so
 * the lines are never filtered on it.
 */
const getPurchaseQuotationDetail = async (
  pool: any,
  refNo: string,
  row: any
): Promise<{ header: any; lines: any[]; additionalCharges: any[] }> => {
  if (!refNo) return { header: {}, lines: [], additionalCharges: [] };

  const [hdrResult, dtlResult, chargeResult] = await Promise.all([
    pool
      .request()
      .input("STATUS", sql.VarChar(20), "ALL")
      .execute("VPurchase.SHOW_PURCHASE_QUOTATION_HDR"),
    pool
      .request()
      .input("STATUS", sql.VarChar(20), "ALL")
      .input("PURCHASE_QUOTATION_NO", sql.VarChar(50), refNo)
      .execute("VPurchase.SHOW_PURCHASE_QUOTATION_DTL"),
    pool
      .request()
      .input("PURCHASE_QUOTATION_NO", sql.VarChar(50), refNo)
      .execute("VPurchase.SHOW_PURCHASE_QUOTATION_ADDITIONAL_CHARGES_DTL"),
  ]);

  const h: any =
    (hdrResult.recordset || []).find(
      (r: any) => String(r.PURCHASE_QUOTATION_NO) === String(refNo)
    ) || {};

  /* Payment term / payment mode names are not in the header projection, and the
     additional charge type name is not in the charge row, so both are resolved
     here. Best effort: an unknown id simply leaves the name null. */
  const lookupName = async (
    table: string,
    idCol: string,
    nameCol: string,
    id: any
  ): Promise<string | null> => {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) return null;
    try {
      const res = await pool
        .request()
        .query(
          `SELECT TOP 1 ${nameCol} AS name FROM VMaster.${table} WHERE ${idCol} = ${numericId}`
        );
      return res.recordset?.[0]?.name ?? null;
    } catch {
      return null;
    }
  };

  const chargeRows: any[] = chargeResult.recordset || [];
  const chargeTypeIds = Array.from(
    new Set(
      chargeRows
        .map((c) => Number(c.ADDITIONAL_CHARGE_TYPE_ID))
        .filter((n) => Number.isFinite(n))
    )
  );

  const [paymentTermName, paymentModeName, chargeTypeNames] = await Promise.all([
    lookupName(
      "TBL_PAYMENT_TERM_MASTER",
      "PAYMENT_TERM_ID",
      "PAYMENT_TERM_NAME",
      h.PAYMENT_TERM_ID
    ),
    lookupName(
      "TBL_PAYMENT_MODE_MASTER",
      "PAYMENT_MODE_ID",
      "PAYMENT_MODE_NAME",
      h.PAYMENT_MODE_ID
    ),
    (async () => {
      const map = new Map<number, string>();
      if (chargeTypeIds.length === 0) return map;
      try {
        const res = await pool
          .request()
          .query(
            `SELECT ADDITIONAL_CHARGE_TYPE_ID, ADDITIONAL_CHARGE_TYPE_NAME
               FROM VMaster.TBL_ADDITIONAL_CHARGE_TYPE_MASTER
              WHERE ADDITIONAL_CHARGE_TYPE_ID IN (${chargeTypeIds.join(",")})`
          );
        for (const r of res.recordset || []) {
          map.set(Number(r.ADDITIONAL_CHARGE_TYPE_ID), String(r.ADDITIONAL_CHARGE_TYPE_NAME ?? ""));
        }
      } catch {
        /* name resolution is cosmetic */
      }
      return map;
    })(),
  ]);

  const header = {
    purchaseQuotationNo: h.PURCHASE_QUOTATION_NO ?? refNo,
    purchaseQuotationDate: h.PURCHASE_QUOTATION_DATE ?? row?.poDate ?? null,
    purchaseRequestNo: row?.purchaseRequestNo ?? null,
    companyId: h.COMPANY_ID ?? row?.companyId ?? null,
    companyName: h.COMPANY_NAME ?? row?.companyName ?? null,
    supplierId: h.SUPPLIER_BP_ID ?? row?.supplierId ?? null,
    supplierName: h.SUPPLIER_NAME ?? row?.supplierName ?? null,
    branchId: h.BRANCH_ID ?? row?.branchId ?? null,
    branchName: h.BRANCH_NAME ?? row?.branchName ?? null,
    poStoreId: h.PO_STORE_ID ?? row?.poStoreId ?? null,
    poStoreName: h.PO_STORE_NAME ?? row?.storeName ?? null,
    supplierQuotationNo: h.SUPPLIER_QUOTATION_NO ?? null,
    supplierQuotationDate: h.SUPPLIER_QUOTATION_DATE ?? null,
    validFromDate: h.VALID_FROM_DATE ?? null,
    validToDate: h.VALID_TO_DATE ?? null,
    paymentTermId: h.PAYMENT_TERM_ID ?? null,
    paymentTermName,
    paymentModeId: h.PAYMENT_MODE_ID ?? null,
    paymentModeName,
    shipmentModeId: h.SHIPMENT_MODE_ID ?? null,
    shipmentModeName: h.SHIPMENT_MODE_NAME ?? null,
    deliveryDate: h.DELIVERY_DATE ?? null,
    deliveryTerm: h.DELIVERY_TERM ?? null,
    deliveryLocationId: h.DELIVERY_LOCATION_ID ?? row?.deliveryLocationId ?? null,
    deliveryLocationName: row?.deliveryLocationName ?? null,
    currencyId: h.CURRENCY_ID ?? row?.currencyType ?? null,
    currencyName: row?.currencyName ?? null,
    exchangeRate: h.EXCHANGE_RATE ?? null,
    subTotalAmount: h.TOTAL_SUB_TOTAL_HDR_AMOUNT_FC ?? null,
    discountAmount: h.TOTAL_DISCOUNT_HDR_AMOUNT_FC ?? null,
    totalProductAmount: h.TOTAL_PRODUCT_HDR_AMOUNT_FC ?? null,
    taxAmount: h.TOTAL_VAT_HDR_AMOUNT_FC ?? null,
    totalAmount: h.FINAL_PRODUCT_HDR_AMOUNT_FC ?? row?.amount ?? null,
    subTotalAmountLc: h.TOTAL_SUB_TOTAL_HDR_AMOUNT_LC ?? null,
    discountAmountLc: h.TOTAL_DISCOUNT_HDR_AMOUNT_LC ?? null,
    totalProductAmountLc: h.TOTAL_PRODUCT_HDR_AMOUNT_LC ?? null,
    taxAmountLc: h.TOTAL_TAX_HDR_AMOUNT_LC ?? null,
    totalAmountLc: h.FINAL_PRODUCT_HDR_AMOUNT_LC ?? null,
    quotationStatusId: h.QUOTATION_STATUS_ID ?? null,
    quotationStatusName: h.QUOTATION_STATUS_NAME ?? null,
    statusEntry: h.STATUS_ENTRY ?? row?.statusEntry ?? null,
    shipmentRemarks: h.SHIPMENT_REMARKS ?? row?.reason ?? null,
    remarks: h.REMARKS ?? row?.remarks ?? null,
    createdBy: h.CREATED_BY ?? row?.requestedBy ?? null,
    createdDate: h.CREATED_DATE ?? row?.createdDate ?? null,
    modifiedBy: h.MODIFIED_BY ?? null,
    modifiedDate: h.MODIFIED_DATE ?? null,
  };

  const lines = (dtlResult.recordset || []).map((d: any) => ({
    id: d.PURCHASE_QUOTATION_DTL_ID,
    lineNo: d.LINE_NO,
    purchaseRequestNo: d.PURCHASE_REQUEST_NO,
    referenceTypeName: d.REFERENCE_TYPE_NAME,
    referenceNo: d.REFERENCE_NO,
    mainCategoryName: d.MAIN_CATEGORY_NAME,
    subCategoryName: d.SUB_CATEGORY_NAME,
    productId: d.PRODUCT_ID,
    productName: d.PRODUCT_NAME,
    description: d.REMARKS,
    noOfPcsPerPacking: d.NO_OF_PCS_PER_PACKING,
    totalQuantity: d.TOTAL_QUANTITY,
    orderedQty: d.TOTAL_QUANTITY,
    uomId: d.UOM_ID,
    uomName: d.UOM_NAME,
    altUomId: d.ALT_UOM_ID,
    altUomName: d.ALT_UOM_NAME,
    totalPacking: d.TOTAL_PACKING,
    rate: d.RATE,
    ratePerPcs: d.RATE,
    discountPercentage: d.DISCOUNT_PERCENTAGE,
    discountAmount: d.DISCOUNT_AMOUNT_FC,
    subTotalAmount: d.SUB_TOTAL_AMOUNT_FC,
    totalProductAmount: d.TOTAL_PRODUCT_AMOUNT_FC,
    taxName: d.TAX_NAME,
    taxPercentage: d.TAX_PERCENTAGE,
    taxAmount: d.TAX_AMOUNT_FC,
    finalAmount: d.FINAL_AMOUNT_FC,
    amount: d.FINAL_AMOUNT_FC,
    exchangeRate: d.EXCHANGE_RATE,
    subTotalAmountLc: d.SUB_TOTAL_AMOUNT_LC,
    discountAmountLc: d.DISCOUNT_AMOUNT_LC,
    totalProductAmountLc: d.TOTAL_PRODUCT_AMOUNT_LC,
    taxAmountLc: d.TAX_AMOUNT_LC,
    finalAmountLc: d.FINAL_AMOUNT_LC,
    requiredDate: d.REQUIRED_DATE,
    reason: d.REASON,
    remarks: d.REMARKS,
    campId: d.CAMP_ID,
    requestStoreId: d.REQUEST_STORE_ID,
  }));

  const additionalCharges = chargeRows.map((c: any) => ({
    id: c.PURCHASE_QUOTATION_ADDITIONAL_CHARGES_ID,
    lineNo: c.LINE_NO,
    chargeTypeId: c.ADDITIONAL_CHARGE_TYPE_ID,
    chargeTypeName:
      chargeTypeNames.get(Number(c.ADDITIONAL_CHARGE_TYPE_ID)) ?? null,
    description: c.DESCRIPTION,
    quantity: c.QUANTITY,
    uomId: c.UOM_ID,
    rate: c.RATE,
    totalAmount: c.TOTAL_AMOUNT_FC,
    taxPercentage: c.TAX_PERCENTAGE,
    taxAmount: c.TAX_AMOUNT_FC,
    finalAmount: c.FINAL_AMOUNT_FC,
    totalAmountLc: c.TOTAL_AMOUNT_LC,
    taxAmountLc: c.TAX_AMOUNT_LC,
    finalAmountLc: c.FINAL_AMOUNT_LC,
    remarks: c.REMARKS,
  }));

  return { header, lines, additionalCharges };
};

/**
 * Purchase Order header, lines and additional charges, shaped for the detail
 * panel and the expansion cards.
 *
 * The list row already carries the joined header fields; the read proc only
 * filters by order number, so the requested row is picked out of the
 * SHOW_PURCHASE_ORDER_HDR result by PURCHASE_ORDER_NO.
 *
 * Order lines are stored with STATUS_ENTRY = 'CL' as soon as the order is
 * submitted, so they are never filtered on it.
 */
const getPurchaseOrderDetail = async (
  pool: any,
  refNo: string,
  row: any
): Promise<{ header: any; lines: any[]; additionalCharges: any[] }> => {
  if (!refNo) return { header: {}, lines: [], additionalCharges: [] };

  const [hdrResult, dtlResult, chargeResult] = await Promise.all([
    pool
      .request()
      .input("PURCHASE_ORDER_NO", sql.VarChar(50), refNo)
      .execute("VPurchase.SHOW_PURCHASE_ORDER_HDR"),
    pool
      .request()
      .input("PURCHASE_ORDER_NO", sql.VarChar(50), refNo)
      .execute("VPurchase.SHOW_PURCHASE_ORDER_DTL"),
    pool
      .request()
      .input("PURCHASE_ORDER_NO", sql.VarChar(50), refNo)
      .execute("VPurchase.SHOW_PURCHASE_ORDER_ADDITIONAL_CHARGES_DTL"),
  ]);

  const h: any =
    (hdrResult.recordset || []).find(
      (r: any) => String(r.PURCHASE_ORDER_NO) === String(refNo)
    ) || {};

  /* The additional charge type name is not part of the charge row, so it is
     resolved in one lookup. Best effort: an unknown id leaves the name null. */
  const chargeRows: any[] = chargeResult.recordset || [];
  const chargeTypeIds = Array.from(
    new Set(
      chargeRows
        .map((c) => Number(c.ADDITIONAL_CHARGE_TYPE_ID))
        .filter((n) => Number.isFinite(n))
    )
  );

  const chargeTypeNames = new Map<number, string>();
  if (chargeTypeIds.length > 0) {
    try {
      const res = await pool
        .request()
        .query(
          `SELECT ADDITIONAL_CHARGE_TYPE_ID, ADDITIONAL_CHARGE_TYPE_NAME
             FROM VMaster.TBL_ADDITIONAL_CHARGE_TYPE_MASTER
            WHERE ADDITIONAL_CHARGE_TYPE_ID IN (${chargeTypeIds.join(",")})`
        );
      for (const r of res.recordset || []) {
        chargeTypeNames.set(Number(r.ADDITIONAL_CHARGE_TYPE_ID), String(r.ADDITIONAL_CHARGE_TYPE_NAME ?? ""));
      }
    } catch {
      /* name resolution is cosmetic */
    }
  }

  const header = {
    purchaseOrderNo: h.PURCHASE_ORDER_NO ?? refNo,
    purchaseOrderDate: h.PURCHASE_ORDER_DATE ?? row?.poDate ?? null,
    purchaseQuotationNo: h.PURCHASE_QUOTATION_NO ?? row?.purchaseQuotationNo ?? null,
    purchaseRequestNo: row?.purchaseRequestNo ?? null,
    companyId: h.COMPANY_ID ?? row?.companyId ?? null,
    companyName: h.COMPANY_NAME ?? row?.companyName ?? null,
    supplierId: h.SUPPLIER_BP_ID ?? row?.supplierId ?? null,
    supplierName: h.SUPPLIER_BP_NAME ?? row?.supplierName ?? null,
    branchId: h.BRANCH_ID ?? row?.branchId ?? null,
    branchName: h.BRANCH_NAME ?? row?.branchName ?? null,
    poStoreId: h.PO_STORE_ID ?? row?.poStoreId ?? null,
    poStoreName: h.PO_STORE_NAME ?? row?.storeName ?? null,
    paymentTermId: h.PAYMENT_TERM_ID ?? null,
    paymentTermName: h.PAYMENT_TERM_NAME ?? null,
    paymentModeId: h.PAYMENT_MODE_ID ?? null,
    paymentModeName: h.PAYMENT_MODE_NAME ?? null,
    shipmentModeId: h.SHIPMENT_MODE_ID ?? null,
    shipmentModeName: h.SHIPMENT_MODE_NAME ?? null,
    deliveryDate: h.DELIVERY_DATE ?? null,
    deliveryTerm: h.DELIVERY_TERM ?? null,
    shipmentRemarks: h.SHIPMENT_REMARKS ?? row?.reason ?? null,
    deliveryLocationId: h.DELIVERY_LOCATION_ID ?? row?.deliveryLocationId ?? null,
    deliveryLocationName: h.DELIVERY_LOCATION_NAME ?? row?.deliveryLocationName ?? null,
    currencyId: h.CURRENCY_ID ?? row?.currencyType ?? null,
    currencyName: row?.currencyName ?? h.CURRENCY_NAME ?? null,
    exchangeRate: h.EXCHANGE_RATE ?? null,
    subTotalAmount: h.TOTAL_SUB_TOTAL_HDR_AMOUNT_FC ?? null,
    discountAmount: h.TOTAL_DISCOUNT_HDR_AMOUNT_FC ?? null,
    additionalCostAmount: h.TOTAL_ADDITIONAL_COST_AMOUNT_FC ?? null,
    totalProductAmount: h.TOTAL_PRODUCT_HDR_AMOUNT_FC ?? null,
    taxAmount: h.TOTAL_VAT_HDR_AMOUNT_FC ?? null,
    totalAmount: h.FINAL_PRODUCT_HDR_AMOUNT_FC ?? row?.amount ?? null,
    subTotalAmountLc: h.TOTAL_SUB_TOTAL_HDR_AMOUNT_LC ?? null,
    discountAmountLc: h.TOTAL_DISCOUNT_HDR_AMOUNT_LC ?? null,
    additionalCostAmountLc: h.TOTAL_ADDITIONAL_COST_AMOUNT_LC ?? null,
    totalProductAmountLc: h.TOTAL_PRODUCT_HDR_AMOUNT_LC ?? null,
    taxAmountLc: h.TOTAL_TAX_HDR_AMOUNT_LC ?? null,
    totalAmountLc: h.FINAL_PRODUCT_HDR_AMOUNT_LC ?? null,
    purchaseOrderStatusId: h.PURCHASE_ORDER_STATUS_ID ?? null,
    purchaseOrderStatusName: h.PURCHASE_ORDER_STATUS_NAME ?? null,
    statusEntry: h.STATUS_ENTRY ?? row?.statusEntry ?? null,
    remarks: h.REMARKS ?? row?.remarks ?? null,
    createdBy: h.CREATED_BY ?? row?.requestedBy ?? null,
    createdDate: h.CREATED_DATE ?? row?.createdDate ?? null,
    modifiedBy: h.MODIFIED_BY ?? null,
    modifiedDate: h.MODIFIED_DATE ?? null,
  };

  const lines = (dtlResult.recordset || []).map((d: any) => ({
    id: d.ID ?? d.PURCHASE_ORDER_DTL_ID,
    lineNo: d.LINE_NO,
    purchaseQuotationNo: d.PURCHASE_QUOTATION_NO,
    purchaseRequestNo: d.PURCHASE_REQUEST_NO,
    referenceTypeName: d.REFERENCE_TYPE_NAME,
    referenceNo: d.REFERENCE_NO,
    mainCategoryName: d.MAIN_CATEGORY_NAME,
    subCategoryName: d.SUB_CATEGORY_NAME,
    productId: d.PRODUCT_ID,
    productName: d.PRODUCT_NAME,
    description: d.REMARKS,
    noOfPcsPerPacking: d.NO_OF_PCS_PER_PACKING,
    totalQuantity: d.TOTAL_QUANTITY,
    orderedQty: d.TOTAL_QUANTITY,
    uomId: d.UOM_ID,
    uomName: d.UOM_NAME,
    altUomId: d.ALT_UOM_ID,
    totalPacking: d.TOTAL_PACKING,
    rate: d.RATE,
    ratePerPcs: d.RATE,
    discountPercentage: d.DISCOUNT_PERCENTAGE,
    discountAmount: d.DISCOUNT_AMOUNT_FC,
    subTotalAmount: d.SUB_TOTAL_AMOUNT_FC,
    totalProductAmount: d.TOTAL_PRODUCT_AMOUNT_FC,
    taxName: d.TAX_NAME,
    taxPercentage: d.TAX_PERCENTAGE,
    taxAmount: d.TAX_AMOUNT_FC,
    finalAmount: d.FINAL_AMOUNT_FC,
    amount: d.FINAL_AMOUNT_FC,
    exchangeRate: d.EXCHANGE_RATE,
    subTotalAmountLc: d.SUB_TOTAL_AMOUNT_LC,
    discountAmountLc: d.DISCOUNT_AMOUNT_LC,
    totalProductAmountLc: d.TOTAL_PRODUCT_AMOUNT_LC,
    taxAmountLc: d.TAX_AMOUNT_LC,
    finalAmountLc: d.FINAL_AMOUNT_LC,
    requiredDate: d.REQUIRED_DATE,
    reason: d.REASON,
    remarks: d.REMARKS,
    campId: d.CAMP_ID,
    campName: d.CAMP_NAME,
    requestStoreId: d.REQUEST_STORE_ID,
    requestStoreName: d.REQUEST_STORE_NAME,
  }));

  const additionalCharges = chargeRows.map((c: any) => ({
    id: c.PURCHASE_ORDER_ADDITIONAL_CHARGES_ID,
    lineNo: c.LINE_NO,
    chargeTypeId: c.ADDITIONAL_CHARGE_TYPE_ID,
    chargeTypeName:
      chargeTypeNames.get(Number(c.ADDITIONAL_CHARGE_TYPE_ID)) ?? null,
    description: c.DESCRIPTION,
    quantity: c.QUANTITY,
    uomId: c.UOM_ID,
    rate: c.RATE,
    totalAmount: c.TOTAL_AMOUNT_FC,
    taxPercentage: c.TAX_PERCENTAGE,
    taxAmount: c.TAX_AMOUNT_FC,
    finalAmount: c.FINAL_AMOUNT_FC,
    totalAmountLc: c.TOTAL_AMOUNT_LC,
    taxAmountLc: c.TAX_AMOUNT_LC,
    finalAmountLc: c.FINAL_AMOUNT_LC,
    remarks: c.REMARKS,
  }));

  return { header, lines, additionalCharges };
};

/* The entry screens store their attachments against the page that owns the
   entity: Purchase Request = 262, Purchase Quotation = 266, Purchase Order =
   268. The approval screen has no upload rights, but it must show what was
   attached before submission, so it reads the same document store through
   these page ids only. */
const PURCHASE_REQUEST_DMS_PAGE = 262;
const PURCHASE_QUOTATION_DMS_PAGE = 266;
const PURCHASE_ORDER_DMS_PAGE = 268;
/* Every document the entry screens write is owned by the Document Management
   module (LINK_ID 267); LINK_PAGES_ID is what says which entity it belongs to.
   GET_DOCUMENT_MANAGEMENT_SYSTEM needs the owning link or it returns nothing. */
const DMS_MODULE_LINK_ID = 267;

const approvalDocumentPage = (requestType: string): number | null => {
  if (isPurchaseRequest(requestType)) return PURCHASE_REQUEST_DMS_PAGE;
  if (isPurchaseQuotation(requestType)) return PURCHASE_QUOTATION_DMS_PAGE;
  if (isPurchaseOrder(requestType)) return PURCHASE_ORDER_DMS_PAGE;
  return null;
};

/** Documents attached to the entity, without the binary payload. */
export const getRequestDocuments = async (
  requestType: string,
  refNo: string
): Promise<any[]> => {
  const pageId = approvalDocumentPage(requestType);
  if (!refNo || pageId === null) return [];

  try {
    const rows = await getAllDocumentsService("ALL", pageId, refNo);
    return rows.map((r: any) => ({
      id: Number(r.DMS_ID ?? r.id),
      dmsId: Number(r.DMS_ID ?? r.id),
      fileName: r.FILE_NAME ?? "",
      documentType: r.DOCUMENT_TYPE ?? "",
      description: r.DESCRIPTIONS ?? "",
      contentType: r.CONTENT_TYPE ?? "",
      remarks: r.REMARKS ?? "",
      status: r.STATUS_MASTER ?? "",
      pageRefNo: r.PAGE_REF_NO ?? refNo,
      uploadedBy: r.CREATED_BY ?? "",
      uploadedDate: r.CREATED_DATE ?? null,
    }));
  } catch (error) {
    /* A document-store hiccup must never block the approval detail itself. */
    console.error("Approval documents error:", error);
    return [];
  }
};

/**
 * Binary content for one attached document. Only purchase-flow documents are
 * exposed: the approval app has no DMS permission of its own, so serving an
 * arbitrary DMS id would turn this endpoint into a way around that gate.
 */
export const getApprovalFileService = async (
  id: number
): Promise<{ dmsId: number; fileName: string; contentType: string; pageRefNo: string | null; buffer: Buffer } | null> => {
  const document = await getDocumentByIdService(id, DMS_MODULE_LINK_ID);
  if (!document) return null;

  const pageId = Number(document.LINK_PAGES_ID);
  if (
    pageId !== PURCHASE_REQUEST_DMS_PAGE &&
    pageId !== PURCHASE_QUOTATION_DMS_PAGE &&
    pageId !== PURCHASE_ORDER_DMS_PAGE
  ) {
    return null;
  }

  const base64 = typeof document.CONTENT_DATA === "string" ? document.CONTENT_DATA : null;
  if (!base64) return null;

  return {
    dmsId: Number(document.DMS_ID ?? id),
    fileName: String(document.FILE_NAME || `document-${id}`),
    contentType: String(document.CONTENT_TYPE || "application/octet-stream"),
    pageRefNo: document.PAGE_REF_NO ?? null,
    buffer: Buffer.from(base64, "base64"),
  };
};

/** Single record detail (row + display aliases for the raw UPPERCASE columns). */
export const getRequestDetailService = async (
  requestType: string,
  sno: number
): Promise<any | null> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const rows = await getRequestListService(requestType, "ALL");
  const row = rows.find((r: any) => Number(r.sno ?? r.SNO) === Number(sno));
  if (!row) return null;

  if (isPurchaseRequest(requestType)) {
    const refNo = String(firstNonEmpty(row.poRefNo, row.requestRefNo, row.refNo) ?? "");
    const productLineItems = await getPurchaseRequestLineItems(pool, refNo);
    const files = await getRequestDocuments(requestType, refNo);

    return {
      ...row,
      files,
      productLineItems,
      additionalCosts: [],
      supplier: {},
      company: row.companyName ? { companyName: row.companyName } : {},
      store: firstNonEmpty(row.requestStoreName, row.storeName)
        ? { storeName: firstNonEmpty(row.requestStoreName, row.storeName) }
        : {},
      // The list proc already maps each level; normalising keeps '' / 'Hold' /
      // 'Approval' on the same badge set the panel paints.
      sectionHeadStatus: normalizeStatus(row.sectionHeadStatus),
      response1Status: normalizeStatus(row.response1Status),
      response2Status: normalizeStatus(row.response2Status),
      finalResponseStatus: normalizeStatus(row.finalResponseStatus),
      requestedBy: firstNonEmpty(row.requestedBy),
      requestedDate: firstNonEmpty(row.requestedDate, row.poDate, row.createdDate),
    };
  }

  if (isPurchaseQuotation(requestType)) {
    const refNo = String(
      firstNonEmpty(row.poRefNo, row.requestRefNo, row.refNo) ?? ""
    );
    const { header, lines, additionalCharges } =
      await getPurchaseQuotationDetail(pool, refNo, row);
    const files = await getRequestDocuments(requestType, refNo);

    return {
      ...row,
      ...header,
      files,
      productLineItems: lines,
      additionalCosts: additionalCharges,
      supplier: header.supplierName
        ? { supplierId: header.supplierId, supplierName: header.supplierName }
        : {},
      company: header.companyName ? { companyName: header.companyName } : {},
      store: header.poStoreName ? { storeName: header.poStoreName } : {},
      // The list proc already maps each level; normalising keeps '' / 'Hold' /
      // 'Approval' on the same badge set the panel paints.
      sectionHeadStatus: normalizeStatus(row.sectionHeadStatus),
      response1Status: normalizeStatus(row.response1Status),
      response2Status: normalizeStatus(row.response2Status),
      finalResponseStatus: normalizeStatus(row.finalResponseStatus),
      requestedBy: firstNonEmpty(header.createdBy, row.requestedBy),
      requestedDate: firstNonEmpty(
        row.requestedDate,
        row.poDate,
        header.createdDate
      ),
      // The panel's money columns read currencyType / amount, so the currency
      // NAME (not the id) is what they get.
      currencyType: firstNonEmpty(header.currencyName, row.currencyName),
      amount: firstNonEmpty(header.totalAmount, row.amount),
    };
  }

  if (isPurchaseOrder(requestType)) {
    const refNo = String(
      firstNonEmpty(row.poRefNo, row.requestRefNo, row.refNo) ?? ""
    );
    const { header, lines, additionalCharges } =
      await getPurchaseOrderDetail(pool, refNo, row);
    const files = await getRequestDocuments(requestType, refNo);

    return {
      ...row,
      ...header,
      files,
      productLineItems: lines,
      additionalCosts: additionalCharges,
      supplier: header.supplierName
        ? { supplierId: header.supplierId, supplierName: header.supplierName }
        : {},
      company: header.companyName ? { companyName: header.companyName } : {},
      store: header.poStoreName ? { storeName: header.poStoreName } : {},
      // The list proc already maps each level; normalising keeps '' / 'Hold' /
      // 'Approval' on the same badge set the panel paints.
      sectionHeadStatus: normalizeStatus(row.sectionHeadStatus),
      response1Status: normalizeStatus(row.response1Status),
      response2Status: normalizeStatus(row.response2Status),
      finalResponseStatus: normalizeStatus(row.finalResponseStatus),
      requestedBy: firstNonEmpty(header.createdBy, row.requestedBy),
      requestedDate: firstNonEmpty(
        row.requestedDate,
        row.poDate,
        header.createdDate
      ),
      // The panel's money columns read currencyType / amount, so the currency
      // NAME (not the id) is what they get.
      currencyType: firstNonEmpty(header.currencyName, row.currencyName),
      amount: firstNonEmpty(header.totalAmount, row.amount),
    };
  }

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
    // Prefer the list proc's camelCase aliases: the HR detail path does not
    // re-query the header, so the UPPERCASE columns are not in the projection.
    requestedDate: firstNonEmpty(row.requestedDate, row.CREATED_DATE, row.poDate),
    createdDate: firstNonEmpty(row.createdDate, row.CREATED_DATE),
    amount: row.amount ?? row.REQUEST_AMOUNT ?? row.NO_OF_DAYS ?? null,
    currencyType: firstNonEmpty(row.currencyName, row.currencyType) || "TZS",
    // Prefer the proc's camelCase alias: the raw UPPERCASE columns may be
    // missing from the projection, which used to reset every badge to PENDING.
    response1Status: normalizeStatus(firstNonEmpty(row.response1Status, row.RESPONSE_1_STATUS)),
    response1Person: firstNonEmpty(row.response1Person, row.RESPONSE_1_EMP_ID),
    response1Remarks: firstNonEmpty(row.response1Remarks),
    response2Status: normalizeStatus(firstNonEmpty(row.response2Status, row.RESPONSE_2_STATUS)),
    response2Person: firstNonEmpty(row.response2Person, row.RESPONSE_2_EMP_ID),
    response2Remarks: firstNonEmpty(row.response2Remarks),
    finalResponseStatus: normalizeStatus(firstNonEmpty(row.finalResponseStatus, firstSetStatus)),
  };
};

/** Update a single request's approval status. */
export const updateRequestStatusService = async (params: {
  requestType: string;
  sno: number;
  status: string;
  updatedBy: string;
  holdReason?: string;
  /** Approver's EMP_ID from the access token (Purchase Request only). */
  updatedByEmpId?: number | null;
  /** Approver's IP address (Purchase Request only). */
  approverIp?: string | null;
}): Promise<{ message: string; data?: any }> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  if (isPurchaseRequest(params.requestType)) {
    // Purchase Request has its own sequential three-level update proc: the
    // shared UPDATE_REQUEST_STATUS is table-driven around STATUS_MASTER, which
    // this header does not have.
    const result = await pool
      .request()
      .input("RequestID", sql.Int, params.sno)
      .input("Status", sql.VarChar(50), params.status)
      .input("UpdatedBy", sql.VarChar(50), params.updatedBy || "Admin")
      .input("HoldReason", sql.VarChar(1000), params.holdReason || null)
      .input("UpdatedByEmpId", sql.Int, params.updatedByEmpId ?? null)
      .input("ApproverIp", sql.VarChar(50), params.approverIp || null)
      .execute("VPurchase.UPDATE_APPROVAL_STATUS_PURCHASE_REQUEST");

    const parsed = parseSprocResult(
      result.recordset?.[0],
      "Failed to update purchase request status"
    );

    return {
      message: parsed.message || "Status updated successfully",
      data: parsed.data,
    };
  }

  if (isPurchaseQuotation(params.requestType)) {
    // Purchase Quotation has its own three-level update proc. Its header also
    // lacks STATUS_ID/STATUS_MASTER, so the shared UPDATE_REQUEST_STATUS does
    // not apply. The proc moves QUOTATION_STATUS_ID to 4 on the final approval
    // so the Purchase Order gate opens exactly like the entry screen expects.
    const result = await pool
      .request()
      .input("RequestID", sql.Int, params.sno)
      .input("Status", sql.VarChar(50), params.status)
      .input("UpdatedBy", sql.VarChar(50), params.updatedBy || "Admin")
      .input("HoldReason", sql.VarChar(1000), params.holdReason || null)
      .input("UpdatedByEmpId", sql.Int, params.updatedByEmpId ?? null)
      .input("ApproverIp", sql.VarChar(50), params.approverIp || null)
      .execute("VPurchase.UPDATE_APPROVAL_STATUS_PURCHASE_QUOTATION");

    const parsed = parseSprocResult(
      result.recordset?.[0],
      "Failed to update purchase quotation status"
    );

    return {
      message: parsed.message || "Status updated successfully",
      data: parsed.data,
    };
  }

  if (isPurchaseOrder(params.requestType)) {
    // Purchase Order has its own three-level update proc. RESPONSE_2 is the
    // terminal level and the proc moves PURCHASE_ORDER_STATUS_ID to 4 / 5 so
    // the order lifecycle matches the final decision.
    const result = await pool
      .request()
      .input("RequestID", sql.Int, params.sno)
      .input("Status", sql.VarChar(50), params.status)
      .input("UpdatedBy", sql.VarChar(50), params.updatedBy || "Admin")
      .input("HoldReason", sql.VarChar(1000), params.holdReason || null)
      .input("UpdatedByEmpId", sql.Int, params.updatedByEmpId ?? null)
      .input("ApproverIp", sql.VarChar(50), params.approverIp || null)
      .execute("VPurchase.UPDATE_APPROVAL_STATUS_PURCHASE_ORDER");

    const parsed = parseSprocResult(
      result.recordset?.[0],
      "Failed to update purchase order status"
    );

    return {
      message: parsed.message || "Status updated successfully",
      data: parsed.data,
    };
  }

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