import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface PurchaseQuotationDtl {
  PURCHASE_QUOTATION_DTL_ID?: number;
  PURCHASE_REQUEST_NO?: string;
  PURCHASE_REQUEST_DTL_ID?: number;
  CAMP_ID?: number;
  REQUEST_STORE_ID?: number;
  REFERENCE_TYPE_ID?: number;
  REFERENCE_NO?: string;
  LINE_NO?: number;
  MAIN_CATEGORY_ID?: number;
  SUB_CATEGORY_ID?: number;
  PRODUCT_ID?: number;
  NO_OF_PCS_PER_PACKING?: any;
  TOTAL_QUANTITY?: any;
  UOM_ID?: number;
  TOTAL_PACKING?: any;
  ALT_UOM_ID?: number;
  RATE?: any;
  SUB_TOTAL_AMOUNT_FC?: any;
  DISCOUNT_PERCENTAGE?: any;
  DISCOUNT_AMOUNT_FC?: any;
  TOTAL_PRODUCT_AMOUNT_FC?: any;
  TAX_ID?: number;
  TAX_PERCENTAGE?: any;
  TAX_AMOUNT_FC?: any;
  FINAL_AMOUNT_FC?: any;
  EXCHANGE_RATE?: any;
  SUB_TOTAL_AMOUNT_LC?: any;
  DISCOUNT_AMOUNT_LC?: any;
  TOTAL_PRODUCT_AMOUNT_LC?: any;
  TAX_AMOUNT_LC?: any;
  FINAL_AMOUNT_LC?: any;
  REQUIRED_DATE?: string;
  REASON?: string;
  REMARKS?: string;
  STATUS_ENTRY?: string;
}

export interface PurchaseQuotationData {
  /* The request the lines were pulled from. Both SAVE and UPDATE take this as
     parameter 1, and the form already posts it - it was just not declared here
     and not sent, so the header stored NULL. */
  PURCHASE_REQUEST_NO?: string | null;
  PURCHASE_QUOTATION_NO?: string;
  PURCHASE_QUOTATION_DATE?: string;
  COMPANY_ID?: number | null;
  SUPPLIER_BP_ID?: number | null;
  /* optional FKs are nullable by design: they are stored as NULL, never 0 */
  BRANCH_ID?: number | null;
  PO_STORE_ID?: number | null;
  SUPPLIER_QUOTATION_NO?: string;
  SUPPLIER_QUOTATION_DATE?: string;
  VALID_FROM_DATE?: string;
  VALID_TO_DATE?: string;
  PAYMENT_TERM_ID?: number;
  PAYMENT_MODE_ID?: number;
  SHIPMENT_MODE_ID?: number;
  DELIVERY_DATE?: string;
  DELIVERY_TERM?: string;
  SHIPMENT_REMARKS?: string;
  DELIVERY_LOCATION_ID?: number | null;
  TOTAL_SUB_TOTAL_HDR_AMOUNT_FC?: any;
  TOTAL_DISCOUNT_HDR_AMOUNT_FC?: any;
  TOTAL_PRODUCT_HDR_AMOUNT_FC?: any;
  TOTAL_VAT_HDR_AMOUNT_FC?: any;
  FINAL_PRODUCT_HDR_AMOUNT_FC?: any;
  CURRENCY_ID?: number;
  EXCHANGE_RATE?: any;
  TOTAL_SUB_TOTAL_HDR_AMOUNT_LC?: any;
  TOTAL_DISCOUNT_HDR_AMOUNT_LC?: any;
  TOTAL_PRODUCT_HDR_AMOUNT_LC?: any;
  TOTAL_TAX_HDR_AMOUNT_LC?: any;
  FINAL_PRODUCT_HDR_AMOUNT_LC?: any;
  SECTION_HEAD_RESPONSE_PERSON_EMP_ID?: number;
  SECTION_HEAD_RESPONSE_DATE?: string;
  SECTION_HEAD_RESPONSE_STATUS?: string;
  SECTION_HEAD_RESPONSE_REMARKS?: string;
  SECTION_HEAD_RESPONSE_IP_ADDRESS?: string;
  RESPONSE_1_EMP_ID?: number;
  RESPONSE_1_DATE?: string;
  RESPONSE_1_STATUS?: string;
  RESPONSE_1_REMARKS?: string;
  RESPONSE_1_IP_ADDRESS?: string;
  RESPONSE_2_EMP_ID?: number;
  RESPONSE_2_DATE?: string;
  RESPONSE_2_STATUS?: string;
  RESPONSE_2_REMARKS?: string;
  RESPONSE_2_IP_ADDRESS?: string;
  FINAL_RESPONSE_EMP_ID?: number;
  FINAL_RESPONSE_DATE?: string;
  FINAL_RESPONSE_STATUS?: string;
  FINAL_RESPONSE_REMARKS?: string;
  FINAL_RESPONSE_IP_ADDRESS?: string;
  QUOTATION_STATUS_ID?: number;
  REMARKS?: string;
  STATUS_ENTRY?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
  dtls?: PurchaseQuotationDtl[];
  deletedIds?: number[];
}

export interface PurchaseQuotationListFilter {
  status?: string | null;
  search?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  companyId?: number | null;
  supplierBpId?: number | null;
  page?: number | null;
  pageSize?: number | null;
}

const dateOrNull = (v: any): Date | null => (v ? new Date(v) : null);

const numOrNull = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

const toNullablePage = (v: number | null | undefined): number | null =>
  v == null || !Number.isFinite(Number(v)) || Number(v) < 1 ? null : Math.floor(Number(v));

/* amount / rate helper - keeps 0 as a real 0, blanks as NULL */
const amtOrNull = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

const toNum = (v: any): number => {
  const n = Number(v);
  return v === "" || v === null || v === undefined || Number.isNaN(n) ? 0 : n;
};

const r3 = (n: number) => Math.round(n * 1000) / 1000;

/* ------------------------------------------------------------------ */
/* The SAVE/UPDATE stored procedures only persist the derived amount      */
/* columns - they never calculate them. Relying on the client for those  */
/* values means an omitted field is written as NULL and every header      */
/* roll-up silently breaks, so they are recomputed here from the line's  */
/* own inputs, per the DDL formula notes.                                */
/* ------------------------------------------------------------------ */
const computeDtlAmounts = (dtl: PurchaseQuotationDtl, headerRate: any): PurchaseQuotationDtl => {
  const qty = toNum(dtl.TOTAL_QUANTITY);
  const rate = toNum(dtl.RATE);
  const discPct = toNum(dtl.DISCOUNT_PERCENTAGE);
  const taxPct = toNum(dtl.TAX_PERCENTAGE);
  const pcs = toNum(dtl.NO_OF_PCS_PER_PACKING);

  const exRate = amtOrNull(dtl.EXCHANGE_RATE) ?? amtOrNull(headerRate) ?? 0;

  const subFc = r3(qty * rate);
  const discFc = r3((subFc * discPct) / 100);
  const prodFc = r3(subFc - discFc);
  const taxFc = r3((prodFc * taxPct) / 100);
  const finalFc = r3(prodFc + taxFc);

  /* Per the DTL DDL every LC column is "FC x EXCHANGE_RATE". */
  return {
    ...dtl,
    EXCHANGE_RATE: exRate,
    TOTAL_PACKING: pcs > 0 ? r3(qty / pcs) : amtOrNull(dtl.TOTAL_PACKING),
    SUB_TOTAL_AMOUNT_FC: subFc,
    DISCOUNT_AMOUNT_FC: discFc,
    TOTAL_PRODUCT_AMOUNT_FC: prodFc,
    TAX_AMOUNT_FC: taxFc,
    FINAL_AMOUNT_FC: finalFc,
    SUB_TOTAL_AMOUNT_LC: r3(subFc * exRate),
    DISCOUNT_AMOUNT_LC: r3(discFc * exRate),
    TOTAL_PRODUCT_AMOUNT_LC: r3(prodFc * exRate),
    TAX_AMOUNT_LC: r3(taxFc * exRate),
    FINAL_AMOUNT_LC: r3(finalFc * exRate),
  };
};

/* header totals are the sum of the detail lines */
const computeHeaderTotals = (
  data: PurchaseQuotationData,
  lines: PurchaseQuotationDtl[]
): PurchaseQuotationData => {
  const sum = (k: keyof PurchaseQuotationDtl) =>
    r3(lines.reduce((a, l) => a + toNum(l[k]), 0));

  return {
    ...data,
    TOTAL_SUB_TOTAL_HDR_AMOUNT_FC: sum("SUB_TOTAL_AMOUNT_FC"),
    TOTAL_DISCOUNT_HDR_AMOUNT_FC: sum("DISCOUNT_AMOUNT_FC"),
    TOTAL_PRODUCT_HDR_AMOUNT_FC: sum("TOTAL_PRODUCT_AMOUNT_FC"),
    TOTAL_VAT_HDR_AMOUNT_FC: sum("TAX_AMOUNT_FC"),
    FINAL_PRODUCT_HDR_AMOUNT_FC: sum("FINAL_AMOUNT_FC"),
    TOTAL_SUB_TOTAL_HDR_AMOUNT_LC: sum("SUB_TOTAL_AMOUNT_LC"),
    TOTAL_DISCOUNT_HDR_AMOUNT_LC: sum("DISCOUNT_AMOUNT_LC"),
    TOTAL_PRODUCT_HDR_AMOUNT_LC: sum("TOTAL_PRODUCT_AMOUNT_LC"),
    TOTAL_TAX_HDR_AMOUNT_LC: sum("TAX_AMOUNT_LC"),
    FINAL_PRODUCT_HDR_AMOUNT_LC: sum("FINAL_AMOUNT_LC"),
  };
};

/* ------------------------------------------------------------------ list */
export const getPurchaseQuotationListService = async (
  filter: PurchaseQuotationListFilter = {}
): Promise<{ total: number; rows: any[] }> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PURCHASE_QUOTATION_NO", sql.VarChar(50), null)
      .input("SNO", sql.Int, null)
      .input("Status", sql.VarChar(20), filter.status || "ALL")
      .input("FromDate", sql.Date, filter.fromDate ? new Date(filter.fromDate) : null)
      .input("ToDate", sql.Date, filter.toDate ? new Date(filter.toDate) : null)
      .input("CompanyId", sql.Int, numOrNull(filter.companyId))
      .input("SupplierBpId", sql.Int, numOrNull(filter.supplierBpId))
      .input("Search", sql.NVarChar(200), filter.search || null)
      .input("Page", sql.Int, toNullablePage(filter.page))
      .input("PageSize", sql.Int, toNullablePage(filter.pageSize))
      .execute("VPurchase.GET_PURCHASE_QUOTATION_HDR");

    const recordsets = (result.recordsets || []) as any[][];
    if (recordsets.length >= 2) {
      const rows = (recordsets[1] || []).map((r: any) => ({ ...r, id: r.sno }));
      const total = Number(recordsets[0]?.[0]?.Total ?? rows.length);
      return { total, rows };
    }
    const rows = (recordsets[0] || []).map((r: any) => ({ ...r, id: r.sno }));
    return { total: rows.length, rows };
  } catch (error) {
    console.error("GET_PURCHASE_QUOTATION_HDR SP error:", error);
    throw error;
  }
};

/* --------------------------------------------------------- single header */
export const getPurchaseQuotationHdrService = async (refNo: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PURCHASE_QUOTATION_NO", sql.VarChar(50), refNo)
      .input("SNO", sql.Int, null)
      .input("Status", sql.VarChar(20), "ALL")
      .input("FromDate", sql.Date, null)
      .input("ToDate", sql.Date, null)
      .input("CompanyId", sql.Int, null)
      .input("SupplierBpId", sql.Int, null)
      .input("Search", sql.NVarChar(200), null)
      .input("Page", sql.Int, null)
      .input("PageSize", sql.Int, null)
      .execute("VPurchase.GET_PURCHASE_QUOTATION_HDR");

    const row = result.recordset?.[0] || null;
    if (!row) throw new Error("Purchase Quotation header not found");
    return row;
  } catch (error) {
    console.error("GET_PURCHASE_QUOTATION_HDR (by no) error:", error);
    throw error;
  }
};

/* -------------------------------------------------------------- details */
export const getPurchaseQuotationDtlsService = async (refNo: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(20), "ALL")
      .input("PURCHASE_QUOTATION_NO", sql.VarChar(50), refNo)
      .execute("VPurchase.SHOW_PURCHASE_QUOTATION_DTL");

    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_PURCHASE_QUOTATION_DTL SP error:", error);
    throw error;
  }
};

export const getPurchaseQuotationDtlService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PURCHASE_QUOTATION_DTL_ID", sql.Int, id)
      .execute("VPurchase.GET_PURCHASE_QUOTATION_DTL");

    const row = result.recordset?.[0] || null;
    if (!row) throw new Error("Purchase Quotation detail not found");
    return row;
  } catch (error) {
    console.error("GET_PURCHASE_QUOTATION_DTL SP error:", error);
    throw error;
  }
};

/* --------------------------------------------------------------- options */
export const loadPurchaseQuotationOptionsService = async (
  companyId?: number | null,
  supplierBpId?: number | null,
  statusEntry?: string | null,
  approvalStatus?: string | null
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("CompanyId", sql.Int, numOrNull(companyId))
      .input("SupplierBpId", sql.Int, numOrNull(supplierBpId))
      .input("StatusEntry", sql.VarChar(20), statusEntry || null)
      .input("ApprovalStatus", sql.VarChar(20), approvalStatus || null)
      .execute("VPurchase.LOAD_PURCHASE_QUOTATION_HDR");

    return (result.recordset || []).map((r: any) => ({ ...r, id: r.purchaseQuotationNo }));
  } catch (error) {
    console.error("LOAD_PURCHASE_QUOTATION_HDR SP error:", error);
    throw error;
  }
};

/* ------------------------------------------------- shared dtl request bits */
/* Positional, same as the header builder.
   The caller hands in the request already primed, because the two DTL procs
   differ in their first parameter: UPDATE declares @PURCHASE_QUOTATION_DTL_ID at
   slot 1, SAVE does not have it at all. node-mssql transmits every .input() even
   when the value is null, so the id cannot be sent as a null placeholder on
   create - it has to be absent from the chain entirely, otherwise SAVE is
   called with 40 arguments against a 39 parameter proc. */
const dtlRequest = (
  req: any,
  refNo: string,
  dtl: PurchaseQuotationDtl,
  user: string,
  mac: string,
  statusEntry: string | null
) =>
  req
    .input("PURCHASE_QUOTATION_NO", sql.VarChar(50), refNo)
    .input("PURCHASE_REQUEST_NO", sql.VarChar(50), dtl.PURCHASE_REQUEST_NO || null)
    .input("PURCHASE_REQUEST_DTL_ID", sql.Int, numOrNull(dtl.PURCHASE_REQUEST_DTL_ID))
    .input("CAMP_ID", sql.Int, numOrNull(dtl.CAMP_ID))
    .input("REQUEST_STORE_ID", sql.Int, numOrNull(dtl.REQUEST_STORE_ID))
    .input("REFERENCE_TYPE_ID", sql.Int, numOrNull(dtl.REFERENCE_TYPE_ID))
    .input("REFERENCE_NO", sql.VarChar(50), dtl.REFERENCE_NO || null)
    .input("LINE_NO", sql.Int, numOrNull(dtl.LINE_NO) ?? 0)
    .input("MAIN_CATEGORY_ID", sql.Int, numOrNull(dtl.MAIN_CATEGORY_ID))
    .input("SUB_CATEGORY_ID", sql.Int, numOrNull(dtl.SUB_CATEGORY_ID))
    .input("PRODUCT_ID", sql.Int, numOrNull(dtl.PRODUCT_ID))
    .input("NO_OF_PCS_PER_PACKING", sql.Decimal(18, 3), amtOrNull(dtl.NO_OF_PCS_PER_PACKING))
    .input("TOTAL_QUANTITY", sql.Decimal(18, 3), amtOrNull(dtl.TOTAL_QUANTITY))
    .input("UOM_ID", sql.Int, numOrNull(dtl.UOM_ID))
    .input("TOTAL_PACKING", sql.Decimal(18, 3), amtOrNull(dtl.TOTAL_PACKING))
    .input("ALT_UOM_ID", sql.Int, numOrNull(dtl.ALT_UOM_ID))
    .input("RATE", sql.Decimal(18, 3), amtOrNull(dtl.RATE))
    .input("SUB_TOTAL_AMOUNT_FC", sql.Decimal(18, 3), amtOrNull(dtl.SUB_TOTAL_AMOUNT_FC))
    .input("DISCOUNT_PERCENTAGE", sql.Decimal(18, 3), amtOrNull(dtl.DISCOUNT_PERCENTAGE))
    .input("DISCOUNT_AMOUNT_FC", sql.Decimal(18, 3), amtOrNull(dtl.DISCOUNT_AMOUNT_FC))
    .input("TOTAL_PRODUCT_AMOUNT_FC", sql.Decimal(18, 3), amtOrNull(dtl.TOTAL_PRODUCT_AMOUNT_FC))
    .input("TAX_ID", sql.Int, numOrNull(dtl.TAX_ID))
    .input("TAX_PERCENTAGE", sql.Decimal(18, 3), amtOrNull(dtl.TAX_PERCENTAGE))
    .input("TAX_AMOUNT_FC", sql.Decimal(18, 3), amtOrNull(dtl.TAX_AMOUNT_FC))
    .input("FINAL_AMOUNT_FC", sql.Decimal(18, 3), amtOrNull(dtl.FINAL_AMOUNT_FC))
    .input("EXCHANGE_RATE", sql.Decimal(18, 6), amtOrNull(dtl.EXCHANGE_RATE))
    .input("SUB_TOTAL_AMOUNT_LC", sql.Decimal(18, 3), amtOrNull(dtl.SUB_TOTAL_AMOUNT_LC))
    .input("DISCOUNT_AMOUNT_LC", sql.Decimal(18, 3), amtOrNull(dtl.DISCOUNT_AMOUNT_LC))
    .input("TOTAL_PRODUCT_AMOUNT_LC", sql.Decimal(18, 3), amtOrNull(dtl.TOTAL_PRODUCT_AMOUNT_LC))
    .input("TAX_AMOUNT_LC", sql.Decimal(18, 3), amtOrNull(dtl.TAX_AMOUNT_LC))
    .input("FINAL_AMOUNT_LC", sql.Decimal(18, 3), amtOrNull(dtl.FINAL_AMOUNT_LC))
    .input("REQUIRED_DATE", sql.DateTime, dateOrNull(dtl.REQUIRED_DATE))
    .input("REASON", sql.VarChar(500), dtl.REASON || null)
    .input("REMARKS", sql.VarChar(500), dtl.REMARKS || null)
    /* @ITEM_TYPE is slot 36. It was never sent, so the column has always been
       NULL; the proc still counts the parameter, so it has to be supplied. */
    .input("ITEM_TYPE", sql.VarChar(50), (dtl as any).ITEM_TYPE || null)
    /* @STATUS_ENTRY sits between @ITEM_TYPE and @USER, not after @MAC_ADDRESS. */
    .input("STATUS_ENTRY", sql.VarChar(20), statusEntry)
    .input("USER", sql.VarChar(50), user)
    .input("MAC_ADDRESS", sql.VarChar(50), mac);

/* A quoted line's reference describes the request it was quoted for, so it is
   derived from the request line rather than accepted from the caller. The request
   line's own ref no wins; the request number is the fallback, because a request
   line's ref no is optional and is normally blank. A line with no request link is
   left alone - there is nothing to derive it from, and the user types it.

   Done in one query for the whole document rather than per line, because a
   quotation can carry dozens of lines. */
const applyRequestReferenceNo = async (
  dtls: PurchaseQuotationDtl[]
): Promise<PurchaseQuotationDtl[]> => {
  const linked = dtls.filter((d) => numOrNull(d.PURCHASE_REQUEST_DTL_ID) != null);
  if (linked.length === 0) return dtls;

  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const ids = Array.from(
    new Set(linked.map((d) => numOrNull(d.PURCHASE_REQUEST_DTL_ID) as number))
  );
  const result = await pool
    .request()
    .input("IDS", sql.VarChar(4000), ids.join(","))
    .query(
      `SELECT d.PURCHASE_REQUEST_DTL_ID, h.PURCHASE_REQUEST_NO, d.REFERENCE_NO
         FROM VPurchase.TBL_PURCHASE_REQUEST_DTL d
         JOIN VPurchase.TBL_PURCHASE_REQUEST_HDR h
           ON h.PURCHASE_REQUEST_NO = d.PURCHASE_REQUEST_NO
        WHERE d.PURCHASE_REQUEST_DTL_ID IN (SELECT [value] FROM STRING_SPLIT(@IDS, ','))`
    );

  const byDtlId = new Map<string, string>();
  for (const r of result.recordset || []) {
    const own = String(r.REFERENCE_NO ?? "").trim();
    byDtlId.set(
      String(r.PURCHASE_REQUEST_DTL_ID),
      own || String(r.PURCHASE_REQUEST_NO ?? "").trim()
    );
  }

  return dtls.map((d) => {
    const id = numOrNull(d.PURCHASE_REQUEST_DTL_ID);
    if (id == null) return d;
    const derived = byDtlId.get(String(id));
    /* Unreachable while FK_TBL_PURCHASE_QUOTATION_DTL_REQUEST_DTL holds, since a
       linked id always has a request line to resolve. Kept so a bad id blanks
       nothing rather than overwriting a reference with an empty string. */
    if (!derived) return d;
    return { ...d, REFERENCE_NO: derived };
  });
};

const savePurchaseQuotationDtlService = async (
  refNo: string,
  dtl: PurchaseQuotationDtl,
  user: string,
  macAddress: string
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  /* SAVE has no @PURCHASE_QUOTATION_DTL_ID, so the chain starts without it. */
  const request = dtlRequest(pool.request(), refNo, dtl, user, macAddress, dtl.STATUS_ENTRY || "AC");
  const result = await request.execute("VPurchase.SAVE_PURCHASE_QUOTATION_DTL");

  parseSprocResult(result.recordset?.[0], "Failed to save purchase quotation detail");
  return result.recordset?.[0];
};

const updatePurchaseQuotationDtlService = async (
  refNo: string,
  dtl: PurchaseQuotationDtl,
  user: string,
  macAddress: string
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  /* UPDATE expects @PURCHASE_QUOTATION_DTL_ID as parameter 1, so it is primed
     onto the request before the shared chain adds the rest. */
  const request = dtlRequest(
    pool.request().input("PURCHASE_QUOTATION_DTL_ID", sql.Int, numOrNull(dtl.PURCHASE_QUOTATION_DTL_ID) ?? 0),
    refNo,
    dtl,
    user,
    macAddress,
    dtl.STATUS_ENTRY || null
  );
  const result = await request.execute("VPurchase.UPDATE_PURCHASE_QUOTATION_DTL");

  parseSprocResult(result.recordset?.[0], "Failed to update purchase quotation detail");
  return result.recordset?.[0];
};

/* ------------------------------------------------------- combined header */
/* node-mssql sends input() values to execute("<proc>") POSITIONALLY, so this
   order must match the deployed SAVE/UPDATE_PURCHASE_QUOTATION_HDR signature
   exactly. One parameter too many raises "too many arguments specified"; a
   parameter in the wrong slot does not error at all, it silently writes a
   value into the wrong column. Keep the two in step. */
const hdrRequest = (
  pool: any,
  data: PurchaseQuotationData,
  refNo: string | null,
  statusEntry: string | null
) =>
  pool
    .request()
    /* Both procs declare @PURCHASE_REQUEST_NO as parameter 1. It was not being
       sent, so the header stored NULL and lost the link to the request its
       lines were pulled from. */
    .input("PURCHASE_REQUEST_NO", sql.VarChar(50), data.PURCHASE_REQUEST_NO || null)
    .input("PURCHASE_QUOTATION_NO", sql.VarChar(50), refNo)
    .input("PURCHASE_QUOTATION_DATE", sql.DateTime, dateOrNull(data.PURCHASE_QUOTATION_DATE))
    .input("COMPANY_ID", sql.Int, numOrNull(data.COMPANY_ID))
    .input("SUPPLIER_BP_ID", sql.Int, numOrNull(data.SUPPLIER_BP_ID))
    .input("BRANCH_ID", sql.Int, numOrNull(data.BRANCH_ID))
    .input("PO_STORE_ID", sql.Int, numOrNull(data.PO_STORE_ID))
    .input("SUPPLIER_QUOTATION_NO", sql.VarChar(100), data.SUPPLIER_QUOTATION_NO || null)
    .input("SUPPLIER_QUOTATION_DATE", sql.DateTime, dateOrNull(data.SUPPLIER_QUOTATION_DATE))
    .input("VALID_FROM_DATE", sql.DateTime, dateOrNull(data.VALID_FROM_DATE))
    .input("VALID_TO_DATE", sql.DateTime, dateOrNull(data.VALID_TO_DATE))
    .input("PAYMENT_TERM_ID", sql.Int, numOrNull(data.PAYMENT_TERM_ID))
    .input("PAYMENT_MODE_ID", sql.Int, numOrNull(data.PAYMENT_MODE_ID))
    .input("SHIPMENT_MODE_ID", sql.Int, numOrNull(data.SHIPMENT_MODE_ID))
    .input("DELIVERY_DATE", sql.DateTime, dateOrNull(data.DELIVERY_DATE))
    .input("DELIVERY_TERM", sql.VarChar(100), data.DELIVERY_TERM || null)
    .input("SHIPMENT_REMARKS", sql.VarChar(500), data.SHIPMENT_REMARKS || null)
    .input("DELIVERY_LOCATION_ID", sql.Int, numOrNull(data.DELIVERY_LOCATION_ID))
    .input("TOTAL_SUB_TOTAL_HDR_AMOUNT_FC", sql.Decimal(18, 3), amtOrNull(data.TOTAL_SUB_TOTAL_HDR_AMOUNT_FC))
    .input("TOTAL_DISCOUNT_HDR_AMOUNT_FC", sql.Decimal(18, 3), amtOrNull(data.TOTAL_DISCOUNT_HDR_AMOUNT_FC))
    .input("TOTAL_PRODUCT_HDR_AMOUNT_FC", sql.Decimal(18, 3), amtOrNull(data.TOTAL_PRODUCT_HDR_AMOUNT_FC))
    .input("TOTAL_VAT_HDR_AMOUNT_FC", sql.Decimal(18, 3), amtOrNull(data.TOTAL_VAT_HDR_AMOUNT_FC))
    .input("FINAL_PRODUCT_HDR_AMOUNT_FC", sql.Decimal(18, 3), amtOrNull(data.FINAL_PRODUCT_HDR_AMOUNT_FC))
    .input("CURRENCY_ID", sql.Int, numOrNull(data.CURRENCY_ID))
    .input("EXCHANGE_RATE", sql.Decimal(18, 6), amtOrNull(data.EXCHANGE_RATE))
    .input("TOTAL_SUB_TOTAL_HDR_AMOUNT_LC", sql.Decimal(18, 3), amtOrNull(data.TOTAL_SUB_TOTAL_HDR_AMOUNT_LC))
    .input("TOTAL_DISCOUNT_HDR_AMOUNT_LC", sql.Decimal(18, 3), amtOrNull(data.TOTAL_DISCOUNT_HDR_AMOUNT_LC))
    .input("TOTAL_PRODUCT_HDR_AMOUNT_LC", sql.Decimal(18, 3), amtOrNull(data.TOTAL_PRODUCT_HDR_AMOUNT_LC))
    .input("TOTAL_TAX_HDR_AMOUNT_LC", sql.Decimal(18, 3), amtOrNull(data.TOTAL_TAX_HDR_AMOUNT_LC))
    .input("FINAL_PRODUCT_HDR_AMOUNT_LC", sql.Decimal(18, 3), amtOrNull(data.FINAL_PRODUCT_HDR_AMOUNT_LC))
    /* The SECTION_HEAD_RESPONSE_* / RESPONSE_1_* / RESPONSE_2_* /
       FINAL_RESPONSE_* block that used to sit here is a Purchase Request
       approval chain. SAVE/UPDATE_PURCHASE_QUOTATION_HDR do not declare those
       20 parameters, and node-mssql counts them, so sending them aborted every
       save with "too many arguments specified". A quotation is approved through
       QUOTATION_STATUS_ID + STATUS_ENTRY, so nothing is lost by not sending
       them; the columns on the table simply stay NULL. */
    .input("QUOTATION_STATUS_ID", sql.Int, numOrNull(data.QUOTATION_STATUS_ID))
    .input("REMARKS", sql.VarChar(500), data.REMARKS || null)
    /* @STATUS_ENTRY is parameter 35, between @REMARKS and @USER. It used to be
       chained on after @MAC_ADDRESS by each caller, which put it in slot 57. */
    .input("STATUS_ENTRY", sql.VarChar(20), statusEntry)
    .input("USER", sql.VarChar(50), data.USER || "Admin")
    .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

/* ---------------------------------------------------------------- create */
export const savePurchaseQuotationCombinedService = async (raw: PurchaseQuotationData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    /* derive the line amounts and the header roll-ups before touching the DB,
       so the stored values always satisfy the DDL formulas */
    const dtls = await applyRequestReferenceNo(
      (Array.isArray(raw.dtls) ? raw.dtls : []).map((d) => computeDtlAmounts(d, raw.EXCHANGE_RATE))
    );
    const data = computeHeaderTotals(raw, dtls);

    const hdrResult = await hdrRequest(pool, data, "", data.STATUS_ENTRY || "CF").execute(
      "VPurchase.SAVE_PURCHASE_QUOTATION_HDR"
    );

    const { message, data: parsedData } = parseSprocResult(
      hdrResult.recordset?.[0],
      "Failed to save purchase quotation header"
    );
    const refNo = String(parsedData ?? data.PURCHASE_QUOTATION_NO ?? "").trim();

    if (!refNo) {
      throw new Error("Can't Generate Purchase Quotation Reference Number. Contact Admin");
    }

    for (const dtl of dtls) {
      await savePurchaseQuotationDtlService(refNo, dtl, data.USER || "Admin", data.MAC_ADDRESS || "WEB");
    }

    return { message: message || "Purchase Quotation created successfully", PURCHASE_QUOTATION_NO: refNo };
  } catch (error) {
    console.error("SAVE_PURCHASE_QUOTATION_HDR/DTL combined error:", error);
    throw error;
  }
};

/* ---------------------------------------------------------------- update */
export const updatePurchaseQuotationCombinedService = async (raw: PurchaseQuotationData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const dtls = await applyRequestReferenceNo(
      (Array.isArray(raw.dtls) ? raw.dtls : []).map((d) => computeDtlAmounts(d, raw.EXCHANGE_RATE))
    );
    const data = computeHeaderTotals(raw, dtls);

    const hdrResult = await hdrRequest(
      pool,
      data,
      data.PURCHASE_QUOTATION_NO || null,
      data.STATUS_ENTRY || null
    ).execute("VPurchase.UPDATE_PURCHASE_QUOTATION_HDR");

    parseSprocResult(hdrResult.recordset?.[0], "Failed to update purchase quotation header");

    const refNo = data.PURCHASE_QUOTATION_NO || "";
    const user = data.USER || "Admin";
    const macAddress = data.MAC_ADDRESS || "WEB";

    for (const dtl of dtls) {
      if (dtl.PURCHASE_QUOTATION_DTL_ID) {
        await updatePurchaseQuotationDtlService(refNo, dtl, user, macAddress);
      } else {
        await savePurchaseQuotationDtlService(refNo, dtl, user, macAddress);
      }
    }

    const deletedIds = Array.isArray(raw.deletedIds) ? raw.deletedIds : [];
    for (const id of deletedIds) {
      await deletePurchaseQuotationDtlService(id, user, data.ROLE || "Admin", macAddress);
    }

    return { message: "Purchase Quotation updated successfully", PURCHASE_QUOTATION_NO: refNo };
  } catch (error) {
    console.error("UPDATE_PURCHASE_QUOTATION_HDR/DTL combined error:", error);
    throw error;
  }
};

/* ---------------------------------------------------------------- delete */
export const deletePurchaseQuotationDtlService = async (
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
      .input("PURCHASE_QUOTATION_DTL_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user)
      .input("ROLE", sql.VarChar(50), role)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VPurchase.DELETE_PURCHASE_QUOTATION_DTL");

    const { message } = parseSprocResult(
      result.recordset?.[0],
      "Failed to delete purchase quotation detail"
    );
    return { message: message || "Purchase Quotation detail deleted successfully" };
  } catch (error) {
    console.error("DELETE_PURCHASE_QUOTATION_DTL error:", error);
    throw error;
  }
};

export const deletePurchaseQuotationHdrService = async (
  refNo: string,
  user = "Admin",
  role = "Admin",
  macAddress = "WEB"
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    /* The header SP refuses to delete while any child row exists. Additional-charge
       rows are owned by a separate module that has no delete service here, so they are
       counted up front: cascading the regular lines first would leave the quotation with
       an empty line set and the charges still attached. */
    const children = await pool
      .request()
      .input("PURCHASE_QUOTATION_NO", sql.VarChar(50), refNo)
      .query(
        `SELECT
           (SELECT COUNT(*) FROM [VPurchase].[TBL_PURCHASE_QUOTATION_DTL]
             WHERE PURCHASE_QUOTATION_NO = @PURCHASE_QUOTATION_NO) AS DTL_COUNT,
           (SELECT COUNT(*) FROM [VPurchase].[TBL_PURCHASE_QUOTATION_ADDITIONAL_CHARGES_DTL]
             WHERE PURCHASE_QUOTATION_NO = @PURCHASE_QUOTATION_NO) AS CHARGE_COUNT`
      );

    const dtlCount = Number(children.recordset?.[0]?.DTL_COUNT || 0);
    const chargeCount = Number(children.recordset?.[0]?.CHARGE_COUNT || 0);

    if (chargeCount > 0) {
      const error = new Error(
        `Cannot delete purchase quotation ${refNo}: it still has ${chargeCount} additional charge(s). Remove the charges first.`
      ) as Error & { httpStatus?: number };
      error.httpStatus = 400;
      throw error;
    }

    const detailIds = await pool
      .request()
      .input("PURCHASE_QUOTATION_NO", sql.VarChar(50), refNo)
      .query(
        `SELECT PURCHASE_QUOTATION_DTL_ID FROM [VPurchase].[TBL_PURCHASE_QUOTATION_DTL] WHERE PURCHASE_QUOTATION_NO = @PURCHASE_QUOTATION_NO`
      );

    for (const row of detailIds.recordset || []) {
      await deletePurchaseQuotationDtlService(
        Number(row.PURCHASE_QUOTATION_DTL_ID),
        user,
        role,
        macAddress
      );
    }

    const result = await pool
      .request()
      .input("PURCHASE_QUOTATION_NO", sql.VarChar(50), refNo)
      .input("USER", sql.VarChar(50), user)
      .input("ROLE", sql.VarChar(50), role)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VPurchase.DELETE_PURCHASE_QUOTATION_HDR");

    const { message } = parseSprocResult(
      result.recordset?.[0],
      "Failed to delete purchase quotation header"
    );

    /* guard against a partial cascade: the header must actually be gone */
    const remaining = await pool
      .request()
      .input("PURCHASE_QUOTATION_NO", sql.VarChar(50), refNo)
      .query(
        `SELECT COUNT(*) AS HDR_COUNT FROM [VPurchase].[TBL_PURCHASE_QUOTATION_HDR] WHERE PURCHASE_QUOTATION_NO = @PURCHASE_QUOTATION_NO`
      );
    if (Number(remaining.recordset?.[0]?.HDR_COUNT || 0) > 0) {
      const error = new Error(
        `Purchase quotation ${refNo} could not be deleted. ${dtlCount} line(s) were removed but the header is still present.`
      ) as Error & { httpStatus?: number };
      error.httpStatus = 400;
      throw error;
    }

    return { message: message || "Purchase Quotation deleted successfully" };
  } catch (error) {
    console.error("DELETE_PURCHASE_QUOTATION_HDR error:", error);
    throw error;
  }
};

/* --------------------------------------------------------------- submit */
/* Moves a saved quotation to the given status without touching anything else.
   The dedicated SP only writes QUOTATION_STATUS_ID and the audit columns,
   because UPDATE_PURCHASE_QUOTATION_HDR is a full overwrite and would wipe
   the supplier, amounts and the whole response/approval history. */
export const submitPurchaseQuotationService = async (
  refNo: string,
  quotationStatusId: number,
  user = "Admin",
  macAddress = "WEB"
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  if (!Number.isFinite(Number(quotationStatusId))) {
    const error = new Error("A target quotation status id is required to submit.") as Error & {
      httpStatus?: number;
    };
    error.httpStatus = 400;
    throw error;
  }

  try {
    const result = await pool
      .request()
      .input("PURCHASE_QUOTATION_NO", sql.VarChar(50), refNo)
      .input("QUOTATION_STATUS_ID", sql.Int, Number(quotationStatusId))
      .input("USER", sql.VarChar(50), user)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .output("OUT_ROWCOUNT", sql.Int)
      .execute("VPurchase.SUBMIT_PURCHASE_QUOTATION");

    const row = result.recordset?.[0] || null;
    const changed = Number(result.output?.OUT_ROWCOUNT ?? 0);

    return {
      message: changed > 0
        ? `Purchase Quotation ${refNo} submitted for approval`
        : `Purchase Quotation ${refNo} was already submitted for approval`,
      changed,
      quotation: row
        ? {
            purchaseQuotationNo: row.PURCHASE_QUOTATION_NO,
            quotationStatusId: row.QUOTATION_STATUS_ID,
            statusEntry: row.STATUS_ENTRY,
            finalResponseStatus: row.FINAL_RESPONSE_STATUS,
          }
        : null,
    };
  } catch (error) {
    console.error("SUBMIT_PURCHASE_QUOTATION error:", error);
    throw error;
  }
};
