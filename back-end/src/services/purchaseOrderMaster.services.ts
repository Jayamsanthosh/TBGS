import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface PurchaseOrderDtl {
  PURCHASE_ORDER_DTL_ID?: number;
  PURCHASE_ORDER_NO?: string;
  PURCHASE_QUOTATION_NO?: string;
  PURCHASE_QUOTATION_DTL_ID?: number;
  PURCHASE_REQUEST_NO?: string;
  PURCHASE_REQUEST_DTL_ID?: number;
  CAMP_ID?: number;
  REQUEST_STORE_ID?: number;
  REFERENCE_TYPE_ID?: number;
  REFERENCE_NO?: string;
  LINE_NO?: number;
  ITEM_TYPE?: string;
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

export interface PurchaseOrderData {
  PURCHASE_ORDER_NO?: string;
  PURCHASE_ORDER_DATE?: string;
  PURCHASE_QUOTATION_NO?: string;
  COMPANY_ID?: number | null;
  SUPPLIER_BP_ID?: number | null;
  BRANCH_ID?: number | null;
  PO_STORE_ID?: number | null;
  PAYMENT_TERM_ID?: number;
  PAYMENT_MODE_ID?: number;
  SHIPMENT_MODE_ID?: number;
  DELIVERY_DATE?: string;
  DELIVERY_TERM?: string;
  SHIPMENT_REMARKS?: string;
  DELIVERY_LOCATION_ID?: number | null;
  TOTAL_SUB_TOTAL_HDR_AMOUNT_FC?: any;
  TOTAL_DISCOUNT_HDR_AMOUNT_FC?: any;
  TOTAL_ADDITIONAL_COST_AMOUNT_FC?: any;
  TOTAL_PRODUCT_HDR_AMOUNT_FC?: any;
  TOTAL_VAT_HDR_AMOUNT_FC?: any;
  FINAL_PRODUCT_HDR_AMOUNT_FC?: any;
  CURRENCY_ID?: number;
  EXCHANGE_RATE?: any;
  TOTAL_SUB_TOTAL_HDR_AMOUNT_LC?: any;
  TOTAL_DISCOUNT_HDR_AMOUNT_LC?: any;
  TOTAL_ADDITIONAL_COST_AMOUNT_LC?: any;
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
  PURCHASE_ORDER_STATUS_ID?: number;
  REMARKS?: string;
  STATUS_ENTRY?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
  dtls?: PurchaseOrderDtl[];
  deletedIds?: number[];
}

const dateOrNull = (v: any): Date | null => (v ? new Date(v) : null);

const numOrNull = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

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
/* columns - they never calculate them, so the values are recomputed here */
/* from the line's own inputs, per the DDL formula notes. The formulas    */
/* match the Purchase Quotation module line for line.                     */
/* ------------------------------------------------------------------ */
const computeDtlAmounts = (dtl: PurchaseOrderDtl, headerRate: any): PurchaseOrderDtl => {
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

/* header totals are the sum of the detail lines; there is no additional
   charges module for the PO, so the additional-cost columns stay 0 */
const computeHeaderTotals = (
  data: PurchaseOrderData,
  lines: PurchaseOrderDtl[]
): PurchaseOrderData => {
  const sum = (k: keyof PurchaseOrderDtl) =>
    r3(lines.reduce((a, l) => a + toNum(l[k]), 0));

  return {
    ...data,
    TOTAL_SUB_TOTAL_HDR_AMOUNT_FC: sum("SUB_TOTAL_AMOUNT_FC"),
    TOTAL_DISCOUNT_HDR_AMOUNT_FC: sum("DISCOUNT_AMOUNT_FC"),
    TOTAL_ADDITIONAL_COST_AMOUNT_FC: 0,
    TOTAL_PRODUCT_HDR_AMOUNT_FC: sum("TOTAL_PRODUCT_AMOUNT_FC"),
    TOTAL_VAT_HDR_AMOUNT_FC: sum("TAX_AMOUNT_FC"),
    FINAL_PRODUCT_HDR_AMOUNT_FC: sum("FINAL_AMOUNT_FC"),
    TOTAL_SUB_TOTAL_HDR_AMOUNT_LC: sum("SUB_TOTAL_AMOUNT_LC"),
    TOTAL_DISCOUNT_HDR_AMOUNT_LC: sum("DISCOUNT_AMOUNT_LC"),
    TOTAL_ADDITIONAL_COST_AMOUNT_LC: 0,
    TOTAL_PRODUCT_HDR_AMOUNT_LC: sum("TOTAL_PRODUCT_AMOUNT_LC"),
    TOTAL_TAX_HDR_AMOUNT_LC: sum("TAX_AMOUNT_LC"),
    FINAL_PRODUCT_HDR_AMOUNT_LC: sum("FINAL_AMOUNT_LC"),
  };
};

/* --------------------------------------------------------------- options */
/* The Purchase Order is always raised against a Purchase Quotation, so the
   dropdown is built from the live quotation options SP, enriched (and pruned)
   with plain queries that need no schema change. */
export const loadPurchaseOrderSourceQuotationsService = async (
  companyId?: number | null,
  statusEntry?: string | null,
  approvalStatus?: string | null
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const result = await pool
    .request()
    .input("CompanyId", sql.Int, numOrNull(companyId))
    .input("SupplierBpId", sql.Int, null)
    .input("StatusEntry", sql.VarChar(20), statusEntry || null)
    .input("ApprovalStatus", sql.VarChar(20), approvalStatus || null)
    .execute("VPurchase.LOAD_PURCHASE_QUOTATION_HDR");

  const rows = (result.recordset || []).map((r: any) => ({ ...r, id: r.purchaseQuotationNo }));

  const quotas = rows
    .map((r: any) => r.purchaseQuotationNo)
    .filter((n: any) => n != null && String(n).trim() !== "");
  if (quotas.length === 0) return rows;

  /* A quotation that already drives a Purchase Order cannot be ordered twice. */
  const ordered = await pool
    .request()
    .input("IDS", sql.VarChar(4000), quotas.join(","))
    .query(
      `SELECT PURCHASE_QUOTATION_NO
         FROM [VPurchase].[TBL_PURCHASE_ORDER_HDR]
        WHERE PURCHASE_QUOTATION_NO IN (SELECT [value] FROM STRING_SPLIT(@IDS, ','))
          AND NULLIF(LTRIM(RTRIM(PURCHASE_QUOTATION_NO)), '') IS NOT NULL`
    );
  const orderedSet = new Set(
    (ordered.recordset || []).map((r: any) => String(r.PURCHASE_QUOTATION_NO ?? "").trim())
  );

  const summaries = await buildQuotationItemSummaries(quotas);

  return rows
    .filter((r: any) => !orderedSet.has(String(r.purchaseQuotationNo ?? "").trim()))
    .map((r: any) => ({
      ...r,
      label: r.displayText || `${r.purchaseQuotationNo || ""} - ${r.supplierName || r.companyName || ""}`,
      detailLineCount: r.detailLineCount ?? null,
      itemSummary: summaries.get(String(r.purchaseQuotationNo ?? "").trim()),
    }));
};

const MAX_SUMMARY_LINES = 4;

const fmtQty = (v: any): string => {
  if (v === "" || v === null || v === undefined) return "";
  const n = Number(v);
  if (Number.isNaN(n)) return "";
  return n.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
};

/* Folds a quotation's detail lines into a one-line summary for the dropdown:
   "Deliver: X · Rice 50 KG · Ref: Store". The delivery location is a header
   value shared by every line, so it leads the string. */
const buildQuotationItemSummaries = async (
  quotationNos: string[]
): Promise<Map<string, string>> => {
  const pool = getPool();
  if (!pool) return new Map();

  const result = await pool
    .request()
    .input("IDS", sql.VarChar(4000), quotationNos.join(","))
    .query(
      `SELECT
          D.PURCHASE_QUOTATION_NO,
          ISNULL(P.PRODUCT_NAME, '') AS ITEM_NAME,
          D.TOTAL_QUANTITY,
          ISNULL(U.UOM_NAME, '') AS UOM_NAME,
          ISNULL(RT.REFERENCE_TYPE_NAME, '') AS REFERENCE_TYPE_NAME,
          ISNULL(L.LOCATION_NAME, '') AS DELIVERY_LOCATION_NAME
       FROM [VPurchase].[TBL_PURCHASE_QUOTATION_DTL] D
       JOIN [VPurchase].[TBL_PURCHASE_QUOTATION_HDR] H
         ON H.PURCHASE_QUOTATION_NO = D.PURCHASE_QUOTATION_NO
       LEFT JOIN [VMaster].[TBL_PRODUCT_MASTER] P
         ON P.PRODUCT_ID = D.PRODUCT_ID
       LEFT JOIN [VMaster].[TBL_UOM_MASTER] U
         ON U.UOM_ID = D.UOM_ID
       LEFT JOIN [VMaster].[TBL_REFERENCE_TYPE_MASTER] RT
         ON RT.REFERENCE_TYPE_ID = D.REFERENCE_TYPE_ID
       LEFT JOIN [VMaster].[TBL_LOCATION_MASTER] L
         ON L.LOCATION_ID = H.DELIVERY_LOCATION_ID
      WHERE D.PURCHASE_QUOTATION_NO IN (SELECT [value] FROM STRING_SPLIT(@IDS, ','))
      ORDER BY D.PURCHASE_QUOTATION_NO, D.LINE_NO`
    );

  const linesByDoc = new Map<string, string[]>();
  const deliveryByDoc = new Map<string, string>();

  for (const r of result.recordset || []) {
    const no = String(r.PURCHASE_QUOTATION_NO ?? "").trim();
    if (!no) continue;

    const delivery = String(r.DELIVERY_LOCATION_NAME ?? "").trim();
    if (delivery && !deliveryByDoc.has(no)) deliveryByDoc.set(no, delivery);

    const name = String(r.ITEM_NAME ?? "").trim();
    if (!name) continue;
    const qty = fmtQty(r.TOTAL_QUANTITY);
    const uom = String(r.UOM_NAME ?? "").trim();
    const refType = String(r.REFERENCE_TYPE_NAME ?? "").trim();

    let entry = name;
    if (qty) entry += ` ${qty}${uom ? " " + uom : ""}`;
    if (refType) entry += ` · Ref: ${refType}`;

    const lines = linesByDoc.get(no) ?? [];
    lines.push(entry);
    linesByDoc.set(no, lines);
  }

  const out = new Map<string, string>();
  for (const [no, lines] of linesByDoc) {
    const head = deliveryByDoc.has(no) ? [`Deliver: ${deliveryByDoc.get(no)}`] : [];
    const shown = lines.slice(0, MAX_SUMMARY_LINES);
    const rest = lines.length - shown.length;
    if (rest > 0) shown.push(`+${rest} more`);
    out.set(no, [...head, ...shown].join(" · "));
  }
  return out;
};

/* ------------------------------------------------------------------- list */
/* SHOW_PURCHASE_ORDER_HDR is the only list SP - it has no pagination, so the
   whole list comes back and the screen filters/paginates client-side. */
export const getPurchaseOrderListService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PURCHASE_ORDER_NO", sql.VarChar(50), null)
      .execute("VPurchase.SHOW_PURCHASE_ORDER_HDR");

    /* SHOW_PURCHASE_ORDER_HDR returns UPPERCASE aliases while the screen reads
       camelCase (as the quotation SP does), so every column is re-aliased here.
       The raw row is kept as well so nothing that still reads the UPPER names
       (the hasDocument probe below, callers) regresses. */
    const rows = (result.recordset || []).map((r: any) => {
      const mapped: any = {
        ...r,
        sno: r.sno ?? r.ID,
        purchaseOrderNo: r.purchaseOrderNo ?? r.PURCHASE_ORDER_NO,
        purchaseOrderDate: r.purchaseOrderDate ?? r.PURCHASE_ORDER_DATE,
        purchaseQuotationNo: r.purchaseQuotationNo ?? r.PURCHASE_QUOTATION_NO,
        companyId: r.companyId ?? r.COMPANY_ID,
        companyName: r.companyName ?? r.COMPANY_NAME,
        supplierBpId: r.supplierBpId ?? r.SUPPLIER_BP_ID,
        supplierName: r.supplierName ?? r.SUPPLIER_BP_NAME,
        branchId: r.branchId ?? r.BRANCH_ID,
        branchName: r.branchName ?? r.BRANCH_NAME,
        poStoreId: r.poStoreId ?? r.PO_STORE_ID,
        poStoreName: r.poStoreName ?? r.PO_STORE_NAME,
        paymentTermId: r.paymentTermId ?? r.PAYMENT_TERM_ID,
        paymentTermName: r.paymentTermName ?? r.PAYMENT_TERM_NAME,
        paymentModeId: r.paymentModeId ?? r.PAYMENT_MODE_ID,
        paymentModeName: r.paymentModeName ?? r.PAYMENT_MODE_NAME,
        shipmentModeId: r.shipmentModeId ?? r.SHIPMENT_MODE_ID,
        shipmentModeName: r.shipmentModeName ?? r.SHIPMENT_MODE_NAME,
        deliveryDate: r.deliveryDate ?? r.DELIVERY_DATE,
        deliveryTerm: r.deliveryTerm ?? r.DELIVERY_TERM,
        shipmentRemarks: r.shipmentRemarks ?? r.SHIPMENT_REMARKS,
        deliveryLocationId: r.deliveryLocationId ?? r.DELIVERY_LOCATION_ID,
        deliveryLocationName: r.deliveryLocationName ?? r.DELIVERY_LOCATION_NAME,
        totalSubTotalHdrAmountFc: r.totalSubTotalHdrAmountFc ?? r.TOTAL_SUB_TOTAL_HDR_AMOUNT_FC,
        totalDiscountHdrAmountFc: r.totalDiscountHdrAmountFc ?? r.TOTAL_DISCOUNT_HDR_AMOUNT_FC,
        totalAdditionalCostAmountFc: r.totalAdditionalCostAmountFc ?? r.TOTAL_ADDITIONAL_COST_AMOUNT_FC,
        totalProductHdrAmountFc: r.totalProductHdrAmountFc ?? r.TOTAL_PRODUCT_HDR_AMOUNT_FC,
        totalVatHdrAmountFc: r.totalVatHdrAmountFc ?? r.TOTAL_VAT_HDR_AMOUNT_FC,
        finalProductHdrAmountFc: r.finalProductHdrAmountFc ?? r.FINAL_PRODUCT_HDR_AMOUNT_FC,
        currencyId: r.currencyId ?? r.CURRENCY_ID,
        currencyName: r.currencyName ?? r.CURRENCY_NAME,
        exchangeRate: r.exchangeRate ?? r.EXCHANGE_RATE,
        totalSubTotalHdrAmountLc: r.totalSubTotalHdrAmountLc ?? r.TOTAL_SUB_TOTAL_HDR_AMOUNT_LC,
        totalDiscountHdrAmountLc: r.totalDiscountHdrAmountLc ?? r.TOTAL_DISCOUNT_HDR_AMOUNT_LC,
        totalAdditionalCostAmountLc: r.totalAdditionalCostAmountLc ?? r.TOTAL_ADDITIONAL_COST_AMOUNT_LC,
        totalProductHdrAmountLc: r.totalProductHdrAmountLc ?? r.TOTAL_PRODUCT_HDR_AMOUNT_LC,
        totalTaxHdrAmountLc: r.totalTaxHdrAmountLc ?? r.TOTAL_TAX_HDR_AMOUNT_LC,
        finalProductHdrAmountLc: r.finalProductHdrAmountLc ?? r.FINAL_PRODUCT_HDR_AMOUNT_LC,
        sectionHeadResponsePersonEmpId: r.sectionHeadResponsePersonEmpId ?? r.SECTION_HEAD_RESPONSE_PERSON_EMP_ID,
        sectionHeadResponseDate: r.sectionHeadResponseDate ?? r.SECTION_HEAD_RESPONSE_DATE,
        sectionHeadResponseStatus: r.sectionHeadResponseStatus ?? r.SECTION_HEAD_RESPONSE_STATUS,
        sectionHeadResponseRemarks: r.sectionHeadResponseRemarks ?? r.SECTION_HEAD_RESPONSE_REMARKS,
        sectionHeadResponseIpAddress: r.sectionHeadResponseIpAddress ?? r.SECTION_HEAD_RESPONSE_IP_ADDRESS,
        response1EmpId: r.response1EmpId ?? r.RESPONSE_1_EMP_ID,
        response1Date: r.response1Date ?? r.RESPONSE_1_DATE,
        response1Status: r.response1Status ?? r.RESPONSE_1_STATUS,
        response1Remarks: r.response1Remarks ?? r.RESPONSE_1_REMARKS,
        response1IpAddress: r.response1IpAddress ?? r.RESPONSE_1_IP_ADDRESS,
        response2EmpId: r.response2EmpId ?? r.RESPONSE_2_EMP_ID,
        response2Date: r.response2Date ?? r.RESPONSE_2_DATE,
        response2Status: r.response2Status ?? r.RESPONSE_2_STATUS,
        response2Remarks: r.response2Remarks ?? r.RESPONSE_2_REMARKS,
        response2IpAddress: r.response2IpAddress ?? r.RESPONSE_2_IP_ADDRESS,
        finalResponseEmpId: r.finalResponseEmpId ?? r.FINAL_RESPONSE_EMP_ID,
        finalResponseDate: r.finalResponseDate ?? r.FINAL_RESPONSE_DATE,
        finalResponseStatus: r.finalResponseStatus ?? r.FINAL_RESPONSE_STATUS,
        finalResponseRemarks: r.finalResponseRemarks ?? r.FINAL_RESPONSE_REMARKS,
        finalResponseIpAddress: r.finalResponseIpAddress ?? r.FINAL_RESPONSE_IP_ADDRESS,
        purchaseOrderStatusId: r.purchaseOrderStatusId ?? r.PURCHASE_ORDER_STATUS_ID,
        purchaseOrderStatusName: r.purchaseOrderStatusName ?? r.PURCHASE_ORDER_STATUS_NAME,
        remarks: r.remarks ?? r.REMARKS,
        statusEntry: r.statusEntry ?? r.STATUS_ENTRY,
      };
      mapped.id = mapped.sno ?? mapped.purchaseOrderNo;
      return mapped;
    });

    /* Submit is refused until a document is uploaded against the order (mirrors
       SUBMIT_PURCHASE_QUOTATION). The list reports which rows already have one
       (single pass over the document table, never CONTENT_DATA) so the UI can
       block Submit up front instead of only finding out on click. */
    const refs = rows
      .map((r: any) => r?.PURCHASE_ORDER_NO ?? r?.purchaseOrderNo)
      .filter((v: any): v is string => typeof v === "string" && v.trim() !== "");

    const withDocs = new Set<string>();
    if (refs.length > 0) {
      const req = pool.request();
      refs.forEach((r, i) => req.input(`r${i}`, sql.VarChar(50), r));
      const docRows = await req.query(
        `SELECT DISTINCT LTRIM(RTRIM(PAGE_REF_NO)) AS PAGE_REF_NO
         FROM VMaster.TBL_DOCUMENT_MANAGEMENT_SYSTEM
         WHERE PAGE_REF_NO IN (${refs.map((_, i) => `@r${i}`).join(",")})`
      );
      for (const d of docRows.recordset || []) {
        if (d?.PAGE_REF_NO != null) withDocs.add(String(d.PAGE_REF_NO).trim().toLowerCase());
      }
    }

    return rows.map((r: any) => ({
      ...r,
      hasDocument: withDocs.has(
        String(r?.PURCHASE_ORDER_NO ?? r?.purchaseOrderNo ?? "").trim().toLowerCase()
      ),
    }));
  } catch (error) {
    console.error("SHOW_PURCHASE_ORDER_HDR SP error:", error);
    throw error;
  }
};

/* --------------------------------------------------------- single header */
/* Reuses the show SP for a single document - it returns every GET column
   plus the joined names, and avoids GET's unaliased DELIVERY_DATE column. */
export const getPurchaseOrderHdrService = async (refNo: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PURCHASE_ORDER_NO", sql.VarChar(50), refNo)
      .execute("VPurchase.SHOW_PURCHASE_ORDER_HDR");

    const row = result.recordset?.find(
      (r: any) => String(r.purchaseOrderNo ?? r.PURCHASE_ORDER_NO ?? "").trim() === String(refNo).trim()
    ) || result.recordset?.[0] || null;
    if (!row) throw new Error("Purchase Order header not found");
    return row;
  } catch (error) {
    console.error("SHOW_PURCHASE_ORDER_HDR (by no) error:", error);
    throw error;
  }
};

/* -------------------------------------------------------------- details */
export const getPurchaseOrderDtlsService = async (refNo: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PURCHASE_ORDER_NO", sql.VarChar(50), refNo)
      .execute("VPurchase.SHOW_PURCHASE_ORDER_DTL");

    /* The proc aliases the id column as "ID" (D.PURCHASE_ORDER_DTL_ID ID); the
       screen's edit flow keys on PURCHASE_ORDER_DTL_ID, so expose it here. Without
       this every loaded line looks new on save and SAVE_PURCHASE_ORDER_DTL rejects
       the reused LINE_NO as a duplicate. */
    return (result.recordset || []).map((r: any) => ({
      ...r,
      PURCHASE_ORDER_DTL_ID: r.PURCHASE_ORDER_DTL_ID ?? r.ID,
    }));
  } catch (error) {
    console.error("SHOW_PURCHASE_ORDER_DTL SP error:", error);
    throw error;
  }
};

export const getPurchaseOrderDtlService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PURCHASE_ORDER_DTL_ID", sql.Int, id)
      .execute("VPurchase.GET_PURCHASE_ORDER_DTL");

    const row = result.recordset?.[0] || null;
    if (!row) throw new Error("Purchase Order detail not found");
    return row;
  } catch (error) {
    console.error("GET_PURCHASE_ORDER_DTL SP error:", error);
    throw error;
  }
};

/* ------------------------------------------------- shared dtl request bits */
/* Positional, same as the header builder: chain order must match the deployed
   DTL proc signatures exactly. SAVE's slot 1 is @PURCHASE_ORDER_NO (no id);
   UPDATE primes @PURCHASE_ORDER_DTL_ID then @PURCHASE_ORDER_NO before this
   chain, which then re-joins from @PURCHASE_QUOTATION_NO onward. */
const orderDtlRequest = (
  req: any,
  poNo: string,
  dtl: PurchaseOrderDtl,
  user: string,
  mac: string,
  statusEntry: string | null
) =>
  req
    .input("PURCHASE_ORDER_NO", sql.VarChar(50), poNo)
    .input("PURCHASE_QUOTATION_NO", sql.VarChar(50), dtl.PURCHASE_QUOTATION_NO || null)
    .input("PURCHASE_QUOTATION_DTL_ID", sql.Int, numOrNull(dtl.PURCHASE_QUOTATION_DTL_ID))
    .input("PURCHASE_REQUEST_NO", sql.VarChar(50), dtl.PURCHASE_REQUEST_NO || null)
    .input("PURCHASE_REQUEST_DTL_ID", sql.Int, numOrNull(dtl.PURCHASE_REQUEST_DTL_ID))
    .input("CAMP_ID", sql.Int, numOrNull(dtl.CAMP_ID))
    .input("REQUEST_STORE_ID", sql.Int, numOrNull(dtl.REQUEST_STORE_ID))
    .input("REFERENCE_TYPE_ID", sql.Int, numOrNull(dtl.REFERENCE_TYPE_ID))
    .input("REFERENCE_NO", sql.VarChar(50), dtl.REFERENCE_NO || null)
    .input("LINE_NO", sql.Int, numOrNull(dtl.LINE_NO) ?? 0)
    .input("ITEM_TYPE", sql.VarChar(50), dtl.ITEM_TYPE || null)
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
    /* @STATUS_ENTRY sits between @REMARKS and @USER at slot 38. */
    .input("STATUS_ENTRY", sql.VarChar(20), statusEntry)
    .input("USER", sql.VarChar(50), user)
    .input("MAC_ADDRESS", sql.VarChar(50), mac);

/* A PO line keeps the reference of the quotation line it was ordered for; that
   line already carried its request-derived reference, so this only fills a
   blank in when the line links back to a request directly. */
const applyReferenceNo = async (dtls: PurchaseOrderDtl[]): Promise<PurchaseOrderDtl[]> => {
  const linked = dtls.filter(
    (d) => numOrNull(d.PURCHASE_REQUEST_DTL_ID) != null && !String(d.REFERENCE_NO ?? "").trim()
  );
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
    byDtlId.set(
      String(r.PURCHASE_REQUEST_DTL_ID),
      String(r.REFERENCE_NO ?? "").trim() || String(r.PURCHASE_REQUEST_NO ?? "").trim()
    );
  }

  return dtls.map((d) => {
    const id = numOrNull(d.PURCHASE_REQUEST_DTL_ID);
    if (id == null || String(d.REFERENCE_NO ?? "").trim()) return d;
    const derived = byDtlId.get(String(id));
    if (!derived) return d;
    return { ...d, REFERENCE_NO: derived };
  });
};

const savePurchaseOrderDtlService = async (
  poNo: string,
  dtl: PurchaseOrderDtl,
  user: string,
  macAddress: string
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const request = orderDtlRequest(pool.request(), poNo, dtl, user, macAddress, dtl.STATUS_ENTRY || "AC");
  const result = await request.execute("VPurchase.SAVE_PURCHASE_ORDER_DTL");

  parseSprocResult(result.recordset?.[0], "Failed to save purchase order detail");
  return result.recordset?.[0];
};

const updatePurchaseOrderDtlService = async (
  poNo: string,
  dtl: PurchaseOrderDtl,
  user: string,
  macAddress: string
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const request = orderDtlRequest(
    pool
      .request()
      .input("PURCHASE_ORDER_DTL_ID", sql.Int, numOrNull(dtl.PURCHASE_ORDER_DTL_ID) ?? 0)
      .input("PURCHASE_ORDER_NO", sql.VarChar(50), poNo),
    poNo,
    dtl,
    user,
    macAddress,
    dtl.STATUS_ENTRY || null
  );
  const result = await request.execute("VPurchase.UPDATE_PURCHASE_ORDER_DTL");

  parseSprocResult(result.recordset?.[0], "Failed to update purchase order detail");
  return result.recordset?.[0];
};

/* ------------------------------------------------------- combined header */
/* node-mssql sends input() values to execute("<proc>") POSITIONALLY, so this
   order must match the deployed SAVE/UPDATE_PURCHASE_ORDER_HDR signature
   exactly: 53 parameters including the full approval (response) block, which
   SAVE/UPDATE DO declare on the PO - unlike the quotation procs - so every
   one must be supplied to keep the later slots aligned. */
const orderHdrRequest = (
  pool: any,
  data: PurchaseOrderData,
  poNo: string | null,
  statusEntry: string | null
) =>
  pool
    .request()
    .input("PURCHASE_ORDER_NO", sql.VarChar(50), poNo)
    .input("PURCHASE_ORDER_DATE", sql.DateTime, dateOrNull(data.PURCHASE_ORDER_DATE))
    .input("PURCHASE_QUOTATION_NO", sql.VarChar(50), data.PURCHASE_QUOTATION_NO || null)
    .input("COMPANY_ID", sql.Int, numOrNull(data.COMPANY_ID))
    .input("SUPPLIER_BP_ID", sql.Int, numOrNull(data.SUPPLIER_BP_ID))
    .input("BRANCH_ID", sql.Int, numOrNull(data.BRANCH_ID))
    .input("PO_STORE_ID", sql.Int, numOrNull(data.PO_STORE_ID))
    .input("PAYMENT_TERM_ID", sql.Int, numOrNull(data.PAYMENT_TERM_ID))
    .input("PAYMENT_MODE_ID", sql.Int, numOrNull(data.PAYMENT_MODE_ID))
    .input("SHIPMENT_MODE_ID", sql.Int, numOrNull(data.SHIPMENT_MODE_ID))
    .input("DELIVERY_DATE", sql.DateTime, dateOrNull(data.DELIVERY_DATE))
    .input("DELIVERY_TERM", sql.VarChar(100), data.DELIVERY_TERM || null)
    .input("SHIPMENT_REMARKS", sql.VarChar(500), data.SHIPMENT_REMARKS || null)
    .input("DELIVERY_LOCATION_ID", sql.Int, numOrNull(data.DELIVERY_LOCATION_ID))
    .input("TOTAL_SUB_TOTAL_HDR_AMOUNT_FC", sql.Decimal(18, 3), amtOrNull(data.TOTAL_SUB_TOTAL_HDR_AMOUNT_FC))
    .input("TOTAL_DISCOUNT_HDR_AMOUNT_FC", sql.Decimal(18, 3), amtOrNull(data.TOTAL_DISCOUNT_HDR_AMOUNT_FC))
    .input("TOTAL_ADDITIONAL_COST_AMOUNT_FC", sql.Decimal(18, 3), amtOrNull(data.TOTAL_ADDITIONAL_COST_AMOUNT_FC ?? 0))
    .input("TOTAL_PRODUCT_HDR_AMOUNT_FC", sql.Decimal(18, 3), amtOrNull(data.TOTAL_PRODUCT_HDR_AMOUNT_FC))
    .input("TOTAL_VAT_HDR_AMOUNT_FC", sql.Decimal(18, 3), amtOrNull(data.TOTAL_VAT_HDR_AMOUNT_FC))
    .input("FINAL_PRODUCT_HDR_AMOUNT_FC", sql.Decimal(18, 3), amtOrNull(data.FINAL_PRODUCT_HDR_AMOUNT_FC))
    .input("CURRENCY_ID", sql.Int, numOrNull(data.CURRENCY_ID))
    .input("EXCHANGE_RATE", sql.Decimal(18, 6), amtOrNull(data.EXCHANGE_RATE))
    .input("TOTAL_SUB_TOTAL_HDR_AMOUNT_LC", sql.Decimal(18, 3), amtOrNull(data.TOTAL_SUB_TOTAL_HDR_AMOUNT_LC))
    .input("TOTAL_DISCOUNT_HDR_AMOUNT_LC", sql.Decimal(18, 3), amtOrNull(data.TOTAL_DISCOUNT_HDR_AMOUNT_LC))
    .input("TOTAL_ADDITIONAL_COST_AMOUNT_LC", sql.Decimal(18, 3), amtOrNull(data.TOTAL_ADDITIONAL_COST_AMOUNT_LC ?? 0))
    .input("TOTAL_PRODUCT_HDR_AMOUNT_LC", sql.Decimal(18, 3), amtOrNull(data.TOTAL_PRODUCT_HDR_AMOUNT_LC))
    .input("TOTAL_TAX_HDR_AMOUNT_LC", sql.Decimal(18, 3), amtOrNull(data.TOTAL_TAX_HDR_AMOUNT_LC))
    .input("FINAL_PRODUCT_HDR_AMOUNT_LC", sql.Decimal(18, 3), amtOrNull(data.FINAL_PRODUCT_HDR_AMOUNT_LC))
    /* Approval / response block: stored NULL on save; the approval app writes
       these through UPDATE. Sent positionally so slots 49-53 hold their place. */
    .input("SECTION_HEAD_RESPONSE_PERSON_EMP_ID", sql.Int, numOrNull(data.SECTION_HEAD_RESPONSE_PERSON_EMP_ID))
    .input("SECTION_HEAD_RESPONSE_DATE", sql.DateTime, dateOrNull(data.SECTION_HEAD_RESPONSE_DATE))
    .input("SECTION_HEAD_RESPONSE_STATUS", sql.VarChar(50), data.SECTION_HEAD_RESPONSE_STATUS || null)
    .input("SECTION_HEAD_RESPONSE_REMARKS", sql.VarChar(500), data.SECTION_HEAD_RESPONSE_REMARKS || null)
    .input("SECTION_HEAD_RESPONSE_IP_ADDRESS", sql.VarChar(50), data.SECTION_HEAD_RESPONSE_IP_ADDRESS || null)
    .input("RESPONSE_1_EMP_ID", sql.Int, numOrNull(data.RESPONSE_1_EMP_ID))
    .input("RESPONSE_1_DATE", sql.DateTime, dateOrNull(data.RESPONSE_1_DATE))
    .input("RESPONSE_1_STATUS", sql.VarChar(50), data.RESPONSE_1_STATUS || null)
    .input("RESPONSE_1_REMARKS", sql.VarChar(500), data.RESPONSE_1_REMARKS || null)
    .input("RESPONSE_1_IP_ADDRESS", sql.VarChar(50), data.RESPONSE_1_IP_ADDRESS || null)
    .input("RESPONSE_2_EMP_ID", sql.Int, numOrNull(data.RESPONSE_2_EMP_ID))
    .input("RESPONSE_2_DATE", sql.DateTime, dateOrNull(data.RESPONSE_2_DATE))
    .input("RESPONSE_2_STATUS", sql.VarChar(50), data.RESPONSE_2_STATUS || null)
    .input("RESPONSE_2_REMARKS", sql.VarChar(500), data.RESPONSE_2_REMARKS || null)
    .input("RESPONSE_2_IP_ADDRESS", sql.VarChar(50), data.RESPONSE_2_IP_ADDRESS || null)
    .input("FINAL_RESPONSE_EMP_ID", sql.Int, numOrNull(data.FINAL_RESPONSE_EMP_ID))
    .input("FINAL_RESPONSE_DATE", sql.DateTime, dateOrNull(data.FINAL_RESPONSE_DATE))
    .input("FINAL_RESPONSE_STATUS", sql.VarChar(50), data.FINAL_RESPONSE_STATUS || null)
    .input("FINAL_RESPONSE_REMARKS", sql.VarChar(500), data.FINAL_RESPONSE_REMARKS || null)
    .input("FINAL_RESPONSE_IP_ADDRESS", sql.VarChar(50), data.FINAL_RESPONSE_IP_ADDRESS || null)
    .input("PURCHASE_ORDER_STATUS_ID", sql.Int, numOrNull(data.PURCHASE_ORDER_STATUS_ID))
    .input("REMARKS", sql.VarChar(500), data.REMARKS || null)
    .input("STATUS_ENTRY", sql.VarChar(20), statusEntry)
    .input("USER", sql.VarChar(50), data.USER || "Admin")
    .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

/* ---------------------------------------------------------------- create */
export const savePurchaseOrderCombinedService = async (raw: PurchaseOrderData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const dtls = await applyReferenceNo(
      (Array.isArray(raw.dtls) ? raw.dtls : []).map((d) => computeDtlAmounts(d, raw.EXCHANGE_RATE))
    );
    const data = computeHeaderTotals(raw, dtls);

    const hdrResult = await orderHdrRequest(pool, data, "", data.STATUS_ENTRY || "CF").execute(
      "VPurchase.SAVE_PURCHASE_ORDER_HDR"
    );

    const { message, data: parsedData } = parseSprocResult(
      hdrResult.recordset?.[0],
      "Failed to save purchase order header"
    );
    const poNo = String(parsedData ?? data.PURCHASE_ORDER_NO ?? "").trim();

    if (!poNo) {
      throw new Error("Can't Generate Purchase Order Reference Number. Contact Admin");
    }

    for (const dtl of dtls) {
      await savePurchaseOrderDtlService(poNo, dtl, data.USER || "Admin", data.MAC_ADDRESS || "WEB");
    }

    return { message: message || "Purchase Order created successfully", PURCHASE_ORDER_NO: poNo };
  } catch (error) {
    console.error("SAVE_PURCHASE_ORDER_HDR/DTL combined error:", error);
    throw error;
  }
};

/* ---------------------------------------------------------------- update */
export const updatePurchaseOrderCombinedService = async (raw: PurchaseOrderData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const dtls = await applyReferenceNo(
      (Array.isArray(raw.dtls) ? raw.dtls : []).map((d) => computeDtlAmounts(d, raw.EXCHANGE_RATE))
    );
    const data = computeHeaderTotals(raw, dtls);

    const hdrResult = await orderHdrRequest(
      pool,
      data,
      data.PURCHASE_ORDER_NO || null,
      data.STATUS_ENTRY || null
    ).execute("VPurchase.UPDATE_PURCHASE_ORDER_HDR");

    parseSprocResult(hdrResult.recordset?.[0], "Failed to update purchase order header");

    const poNo = data.PURCHASE_ORDER_NO || "";
    const user = data.USER || "Admin";
    const macAddress = data.MAC_ADDRESS || "WEB";

    /* Delete removed lines first: a newly added line can reuse the LINE_NO of a
       line queued for deletion, and SAVE_PURCHASE_ORDER_DTL rejects a duplicate
       LINE_NO. Removing first frees those numbers before the writes run. */
    const deletedIds = Array.isArray(raw.deletedIds) ? raw.deletedIds : [];
    for (const id of deletedIds) {
      await deletePurchaseOrderDtlService(id, user, data.ROLE || "Admin", macAddress);
    }

    for (const dtl of dtls) {
      if (dtl.PURCHASE_ORDER_DTL_ID) {
        await updatePurchaseOrderDtlService(poNo, dtl, user, macAddress);
      } else {
        await savePurchaseOrderDtlService(poNo, dtl, user, macAddress);
      }
    }

    return { message: "Purchase Order updated successfully", PURCHASE_ORDER_NO: poNo };
  } catch (error) {
    console.error("UPDATE_PURCHASE_ORDER_HDR/DTL combined error:", error);
    throw error;
  }
};

/* ---------------------------------------------------------------- delete */
export const deletePurchaseOrderDtlService = async (
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
      .input("PURCHASE_ORDER_DTL_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user)
      .input("ROLE", sql.VarChar(50), role)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VPurchase.DELETE_PURCHASE_ORDER_DTL");

    const { message } = parseSprocResult(
      result.recordset?.[0],
      "Failed to delete purchase order detail"
    );
    return { message: message || "Purchase Order detail deleted successfully" };
  } catch (error) {
    console.error("DELETE_PURCHASE_ORDER_DTL error:", error);
    throw error;
  }
};

export const deletePurchaseOrderHdrService = async (
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
       counted up front: cascading the regular lines first would leave the order with
       an empty line set and the charges still attached. */
    const children = await pool
      .request()
      .input("PURCHASE_ORDER_NO", sql.VarChar(50), refNo)
      .query(
        `SELECT
           (SELECT COUNT(*) FROM [VPurchase].[TBL_PURCHASE_ORDER_DTL]
             WHERE PURCHASE_ORDER_NO = @PURCHASE_ORDER_NO) AS DTL_COUNT,
           (SELECT COUNT(*) FROM [VPurchase].[TBL_PURCHASE_ORDER_ADDITIONAL_CHARGES_DTL]
             WHERE PURCHASE_ORDER_NO = @PURCHASE_ORDER_NO) AS CHARGE_COUNT`
      );

    const dtlCount = Number(children.recordset?.[0]?.DTL_COUNT || 0);
    const chargeCount = Number(children.recordset?.[0]?.CHARGE_COUNT || 0);

    if (chargeCount > 0) {
      const error = new Error(
        `Cannot delete purchase order ${refNo}: it still has ${chargeCount} additional charge(s). Remove the charges first.`
      ) as Error & { httpStatus?: number };
      error.httpStatus = 400;
      throw error;
    }

    const detailIds = await pool
      .request()
      .input("PURCHASE_ORDER_NO", sql.VarChar(50), refNo)
      .query(
        `SELECT PURCHASE_ORDER_DTL_ID FROM [VPurchase].[TBL_PURCHASE_ORDER_DTL] WHERE PURCHASE_ORDER_NO = @PURCHASE_ORDER_NO`
      );

    for (const row of detailIds.recordset || []) {
      await deletePurchaseOrderDtlService(
        Number(row.PURCHASE_ORDER_DTL_ID),
        user,
        role,
        macAddress
      );
    }

    const result = await pool
      .request()
      .input("PURCHASE_ORDER_NO", sql.VarChar(50), refNo)
      .input("USER", sql.VarChar(50), user)
      .input("ROLE", sql.VarChar(50), role)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VPurchase.DELETE_PURCHASE_ORDER_HDR");

    const { message } = parseSprocResult(
      result.recordset?.[0],
      "Failed to delete purchase order header"
    );

    /* guard against a partial cascade: the header must actually be gone */
    const remaining = await pool
      .request()
      .input("PURCHASE_ORDER_NO", sql.VarChar(50), refNo)
      .query(
        `SELECT COUNT(*) AS HDR_COUNT FROM [VPurchase].[TBL_PURCHASE_ORDER_HDR] WHERE PURCHASE_ORDER_NO = @PURCHASE_ORDER_NO`
      );
    if (Number(remaining.recordset?.[0]?.HDR_COUNT || 0) > 0) {
      const error = new Error(
        `Purchase order ${refNo} could not be deleted. ${dtlCount} line(s) were removed but the header is still present.`
      ) as Error & { httpStatus?: number };
      error.httpStatus = 400;
      throw error;
    }

    return { message: message || "Purchase Order deleted successfully" };
  } catch (error) {
    console.error("DELETE_PURCHASE_ORDER_HDR error:", error);
    throw error;
  }
};

/* --------------------------------------------------------------- submit */
export const submitPurchaseOrderService = async (
  refNo: string,
  user = "Admin",
  macAddress = "WEB"
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    /* Same gate as SUBMIT_PURCHASE_QUOTATION: an order cannot move to Pending
       until a document is uploaded against it. Checked here so the caller gets
       a real reason instead of the SP silently doing nothing. */
    const badRequest = (message: string) => {
      const err = new Error(message) as Error & { httpStatus?: number };
      err.httpStatus = 400;
      return err;
    };

    const doc = await pool
      .request()
      .input("PURCHASE_ORDER_NO", sql.VarChar(50), refNo)
      .query(
        `SELECT CASE WHEN EXISTS(
              SELECT 1 FROM VMaster.TBL_DOCUMENT_MANAGEMENT_SYSTEM
              WHERE PAGE_REF_NO = @PURCHASE_ORDER_NO
            ) THEN 1 ELSE 0 END AS FOUND`
      );
    if (Number(doc.recordset?.[0]?.FOUND ?? 0) !== 1) {
      throw badRequest(
        `Purchase Order ${refNo} cannot be submitted until a document is uploaded against it. Add one in the Documents tab and try again.`
      );
    }

    const result = await pool
      .request()
      .input("PURCHASE_ORDER_NO", sql.VarChar(50), refNo)
      .input("USER", sql.VarChar(50), user)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .output("OUT_ROWCOUNT", sql.Int)
      .execute("VPurchase.SUBMIT_PURCHASE_ORDER_HDR");

    const row = result.recordset?.[0] || null;
    const changed = Number(result.output?.OUT_ROWCOUNT ?? 0);

    return {
      message: changed > 0
        ? `Purchase Order ${refNo} submitted successfully`
        : `Purchase Order ${refNo} was already submitted`,
      changed,
      order: row
        ? {
            purchaseOrderNo: row.PURCHASE_ORDER_NO,
            statusEntry: row.STATUS_ENTRY,
            finalResponseStatus: row.FINAL_RESPONSE_STATUS,
          }
        : null,
    };
  } catch (error) {
    if (!(error as Error & { httpStatus?: number })?.httpStatus) {
      console.error("SUBMIT_PURCHASE_ORDER_HDR error:", error);
    }
    throw error;
  }
};