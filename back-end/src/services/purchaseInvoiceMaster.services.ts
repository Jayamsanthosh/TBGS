import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult, pickResultRow } from "../utils/sprocResult";
import {
  deletePurchaseInvoiceConversationsByRefService,
  PURCHASE_INVOICE_LINK_PAGES_ID,
} from "./purchaseInvoiceConversation.services";

export interface PurchaseInvoiceDtl {
  key?: string;
  PURCHASE_INVOICE_DTL_ID?: number;
  PURCHASE_INVOICE_REF_NO?: string;
  LINE_NO?: number;
  PURCHASE_ORDER_NO?: string;
  PURCHASE_ORDER_DTL_ID?: number;
  CAMP_ID?: number | null;
  STORE_ID?: number | null;
  MAIN_CATEGORY_ID?: number | null;
  SUB_CATEGORY_ID?: number | null;
  PRODUCT_ID?: number | null;
  DESCRIPTION?: string | null;
  NO_OF_PCS_PER_PACKING?: any;
  INVOICED_QUANTITY?: any;
  UOM_ID?: number | null;
  ALT_QUANTITY?: any;
  ALT_UOM_ID?: number | null;
  RATE_FC?: any;
  EXCHANGE_RATE?: any;
  SUB_TOTAL_AMOUNT_FC?: any;
  DISCOUNT_PERCENTAGE?: any;
  DISCOUNT_AMOUNT_FC?: any;
  TOTAL_PRODUCT_AMOUNT_FC?: any;
  TAX_ID?: number | null;
  TAX_PERCENTAGE?: any;
  TAX_AMOUNT_FC?: any;
  FINAL_AMOUNT_FC?: any;
  SUB_TOTAL_AMOUNT_LC?: any;
  DISCOUNT_AMOUNT_LC?: any;
  TOTAL_PRODUCT_AMOUNT_LC?: any;
  TAX_AMOUNT_LC?: any;
  FINAL_AMOUNT_LC?: any;
  REMARKS?: string | null;
  STATUS_ENTRY?: string;
  PRODUCT_NAME?: string;
  UOM_NAME?: string;
  ALT_UOM_NAME?: string;
  MAIN_CATEGORY_NAME?: string;
  SUB_CATEGORY_NAME?: string;
  TAX_NAME?: string;
}

export interface PurchaseInvoiceData {
  DRAFT_REF_NO?: string | null;
  PURCHASE_INVOICE_REF_NO?: string;
  PURCHASE_INVOICE_DATE?: string | null;
  PURCHASE_ORDER_NO?: string | null;
  SUPPLIER_INVOICE_NO?: string | null;
  SUPPLIER_INVOICE_DATE?: string | null;
  COMPANY_ID?: number | null;
  BRANCH_ID?: number | null;
  CAMP_ID?: number | null;
  STORE_ID?: number | null;
  SUPPLIER_BP_ID?: number | null;
  CURRENCY_ID?: number | null;
  EXCHANGE_RATE?: any;
  PAYMENT_TERM_ID?: number | null;
  PAYMENT_MODE_ID?: number | null;
  DUE_DATE?: string | null;
  TOTAL_SUB_TOTAL_HDR_AMOUNT_FC?: any;
  TOTAL_DISCOUNT_HDR_AMOUNT_FC?: any;
  TOTAL_ADDITIONAL_COST_AMOUNT_FC?: any;
  TOTAL_PRODUCT_HDR_AMOUNT_FC?: any;
  TOTAL_TAX_HDR_AMOUNT_FC?: any;
  FINAL_PRODUCT_HDR_AMOUNT_FC?: any;
  TOTAL_SUB_TOTAL_HDR_AMOUNT_LC?: any;
  TOTAL_DISCOUNT_HDR_AMOUNT_LC?: any;
  TOTAL_ADDITIONAL_COST_AMOUNT_LC?: any;
  TOTAL_PRODUCT_HDR_AMOUNT_LC?: any;
  TOTAL_TAX_HDR_AMOUNT_LC?: any;
  FINAL_PRODUCT_HDR_AMOUNT_LC?: any;
  STATUS_ID?: number | null;
  RESPONSE_BY_EMP_ID?: number | null;
  RESPONSE_DATE?: string | null;
  RESPONSE_REMARKS?: string | null;
  REMARKS?: string | null;
  LINK_PAGES_ID?: number | null;
  STATUS_ENTRY?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
  dtls?: PurchaseInvoiceDtl[];
  deletedIds?: number[];
}

export interface PurchaseInvoiceAdditionalChargeData {
  PURCHASE_INVOICE_ADDITIONAL_CHARGES_DTL_ID?: number;
  PURCHASE_INVOICE_REF_NO: string;
  LINE_NO?: number | null;
  ADDITIONAL_CHARGE_TYPE_ID?: number | null;
  DESCRIPTION?: string | null;
  QUANTITY?: any;
  UOM_ID?: number | null;
  RATE_FC?: any;
  AMOUNT_FC?: any;
  TAX_ID?: number | null;
  TAX_PERCENTAGE?: any;
  TAX_AMOUNT_FC?: any;
  FINAL_AMOUNT_FC?: any;
  AMOUNT_LC?: any;
  TAX_AMOUNT_LC?: any;
  FINAL_AMOUNT_LC?: any;
  REMARKS?: string | null;
  STATUS_ENTRY?: string;
  EXCHANGE_RATE?: any;
  USER?: string;
  MAC_ADDRESS?: string;
}

const dateOrNull = (v: any): Date | null => (v ? new Date(v) : null);

const numOrNull = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

const amtOrNull = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

const toNum = (v: any): number => {
  const n = Number(v);
  return v === "" || v === null || v === undefined || Number.isNaN(n) ? 0 : n;
};

const r3 = (n: number) => Math.round(n * 1000) / 1000;

const computeDtlAmounts = (dtl: PurchaseInvoiceDtl, headerRate: any): PurchaseInvoiceDtl => {
  const qty = toNum(dtl.INVOICED_QUANTITY);
  const rate = toNum(dtl.RATE_FC);
  const discPct = toNum(dtl.DISCOUNT_PERCENTAGE);
  const taxPct = toNum(dtl.TAX_PERCENTAGE);
  const exRate = amtOrNull(dtl.EXCHANGE_RATE) ?? amtOrNull(headerRate) ?? 0;

  const subFc = r3(qty * rate);
  const discFc = r3((subFc * discPct) / 100);
  const prodFc = r3(subFc - discFc);
  const taxFc = r3((prodFc * taxPct) / 100);
  const finalFc = r3(prodFc + taxFc);

  return {
    ...dtl,
    EXCHANGE_RATE: exRate,
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

const computeHeaderTotals = (
  data: PurchaseInvoiceData,
  lines: PurchaseInvoiceDtl[]
): PurchaseInvoiceData => {
  const sum = (k: keyof PurchaseInvoiceDtl) =>
    r3(lines.reduce((a, l) => a + toNum(l[k]), 0));

  return {
    ...data,
    TOTAL_SUB_TOTAL_HDR_AMOUNT_FC: sum("SUB_TOTAL_AMOUNT_FC"),
    TOTAL_DISCOUNT_HDR_AMOUNT_FC: sum("DISCOUNT_AMOUNT_FC"),
    TOTAL_PRODUCT_HDR_AMOUNT_FC: sum("TOTAL_PRODUCT_AMOUNT_FC"),
    TOTAL_TAX_HDR_AMOUNT_FC: sum("TAX_AMOUNT_FC"),
    FINAL_PRODUCT_HDR_AMOUNT_FC: sum("FINAL_AMOUNT_FC"),
    TOTAL_SUB_TOTAL_HDR_AMOUNT_LC: sum("SUB_TOTAL_AMOUNT_LC"),
    TOTAL_DISCOUNT_HDR_AMOUNT_LC: sum("DISCOUNT_AMOUNT_LC"),
    TOTAL_PRODUCT_HDR_AMOUNT_LC: sum("TOTAL_PRODUCT_AMOUNT_LC"),
    TOTAL_TAX_HDR_AMOUNT_LC: sum("TAX_AMOUNT_LC"),
    FINAL_PRODUCT_HDR_AMOUNT_LC: sum("FINAL_AMOUNT_LC"),
    TOTAL_ADDITIONAL_COST_AMOUNT_FC: data.TOTAL_ADDITIONAL_COST_AMOUNT_FC ?? 0,
    TOTAL_ADDITIONAL_COST_AMOUNT_LC: data.TOTAL_ADDITIONAL_COST_AMOUNT_LC ?? 0,
  };
};

const fmtQty = (v: any): string => {
  if (v === "" || v === null || v === undefined) return "";
  const n = Number(v);
  if (Number.isNaN(n)) return "";
  return n.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
};

/* ------------------------------------------------------------------- list */
export const getPurchaseInvoiceListService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PURCHASE_INVOICE_REF_NO", sql.VarChar(50), null)
      .execute("VPurchase.SHOW_PURCHASE_INVOICE_HDR");

    return (result.recordset || []).map((r: any) => ({
      ...r,
      id: r.ID ?? r.PURCHASE_INVOICE_REF_NO,
      purchaseInvoiceRefNo: r.PURCHASE_INVOICE_REF_NO,
      purchaseInvoiceDate: r.PURCHASE_INVOICE_DATE,
      purchaseOrderNo: r.PURCHASE_ORDER_NO,
      supplierInvoiceNo: r.SUPPLIER_INVOICE_NO,
      supplierInvoiceDate: r.SUPPLIER_INVOICE_DATE,
      companyId: r.COMPANY_ID,
      companyName: r.COMPANY_NAME,
      branchId: r.BRANCH_ID,
      branchName: r.BRANCH_NAME,
      campId: r.CAMP_ID,
      campName: r.CAMP_NAME,
      storeId: r.STORE_ID,
      storeName: r.STORE_NAME,
      supplierBpId: r.SUPPLIER_BP_ID,
      supplierName: r.SUPPLIER_BP_NAME,
      currencyId: r.CURRENCY_ID,
      currencyName: r.CURRENCY_NAME,
      exchangeRate: r.EXCHANGE_RATE,
      paymentTermId: r.PAYMENT_TERM_ID,
      paymentTermName: r.PAYMENT_TERM_NAME,
      paymentModeId: r.PAYMENT_MODE_ID,
      paymentModeName: r.PAYMENT_MODE_NAME,
      dueDate: r.DUE_DATE,
      totalSubTotalHdrAmountFc: r.TOTAL_SUB_TOTAL_HDR_AMOUNT_FC,
      totalDiscountHdrAmountFc: r.TOTAL_DISCOUNT_HDR_AMOUNT_FC,
      totalAdditionalCostAmountFc: r.TOTAL_ADDITIONAL_COST_AMOUNT_FC,
      totalProductHdrAmountFc: r.TOTAL_PRODUCT_HDR_AMOUNT_FC,
      totalTaxHdrAmountFc: r.TOTAL_TAX_HDR_AMOUNT_FC,
      finalProductHdrAmountFc: r.FINAL_PRODUCT_HDR_AMOUNT_FC,
      totalSubTotalHdrAmountLc: r.TOTAL_SUB_TOTAL_HDR_AMOUNT_LC,
      totalDiscountHdrAmountLc: r.TOTAL_DISCOUNT_HDR_AMOUNT_LC,
      totalAdditionalCostAmountLc: r.TOTAL_ADDITIONAL_COST_AMOUNT_LC,
      totalProductHdrAmountLc: r.TOTAL_PRODUCT_HDR_AMOUNT_LC,
      totalTaxHdrAmountLc: r.TOTAL_TAX_HDR_AMOUNT_LC,
      finalProductHdrAmountLc: r.FINAL_PRODUCT_HDR_AMOUNT_LC,
      statusId: r.STATUS_ID,
      statusName: r.STATUS_NAME,
      responseByEmpId: r.RESPONSE_BY_EMP_ID,
      responseDate: r.RESPONSE_DATE,
      responseRemarks: r.RESPONSE_REMARKS,
      remarks: r.REMARKS,
      linkPagesId: r.LINK_PAGES_ID,
      statusEntry: r.STATUS_ENTRY,
      hasDocument: !!r.HAS_DOCUMENT,
      dtls: [],
    }));
  } catch (error) {
    console.error("SHOW_PURCHASE_INVOICE_HDR SP error:", error);
    throw error;
  }
};

export const getPurchaseInvoiceHdrService = async (refNo: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const result = await pool
    .request()
    .input("PURCHASE_INVOICE_REF_NO", sql.VarChar(50), refNo)
    .execute("VPurchase.SHOW_PURCHASE_INVOICE_HDR");

  const row = (result.recordset || []).find(
    (r: any) => String(r.PURCHASE_INVOICE_REF_NO ?? "").trim() === String(refNo).trim()
  );
  if (!row) throw new Error("Purchase Invoice header not found");
  return row;
};

export const getPurchaseInvoiceDtlsService = async (refNo: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const result = await pool
    .request()
    .input("PURCHASE_INVOICE_REF_NO", sql.VarChar(50), refNo)
    .execute("VPurchase.SHOW_PURCHASE_INVOICE_DTL");

  return (result.recordset || []).map((r: any) => ({
    ...r,
    PURCHASE_INVOICE_DTL_ID: r.PURCHASE_INVOICE_DTL_ID ?? r.ID,
  }));
};

export const getPurchaseInvoiceDtlService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const result = await pool
    .request()
    .input("PURCHASE_INVOICE_DTL_ID", sql.Int, id)
    .execute("VPurchase.GET_PURCHASE_INVOICE_DTL");

  const row = result.recordset?.[0] || null;
  if (!row) throw new Error("Purchase Invoice detail not found");
  return row;
};

/* ------------------------------------------------------- source orders */
export const loadPurchaseInvoiceSourceOrdersService = async (companyId?: number | null) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const result = await pool
    .request()
    .input("COMPANY_ID", sql.Int, numOrNull(companyId))
    .query(
      `SELECT
          H.PURCHASE_ORDER_NO,
          CONVERT(VARCHAR(10), H.PURCHASE_ORDER_DATE, 23) AS PURCHASE_ORDER_DATE,
          H.COMPANY_ID, C.COMPANY_NAME,
          H.SUPPLIER_BP_ID, BP.BP_NAME AS SUPPLIER_NAME,
          H.BRANCH_ID, BR.BRANCH_NAME,
          H.PO_STORE_ID, ST.STORE_NAME,
          H.CURRENCY_ID, CU.CURRENCY_NAME,
          H.EXCHANGE_RATE,
          H.PAYMENT_TERM_ID, PT.PAYMENT_TERM_NAME,
          H.PAYMENT_MODE_ID, PM.PAYMENT_MODE_NAME,
          H.PURCHASE_ORDER_STATUS_ID, STM.STATUS_NAME AS PURCHASE_ORDER_STATUS_NAME,
          H.STATUS_ENTRY,
          ISNULL(INV.INVOICE_COUNT, 0) AS INVOICE_COUNT,
          DTL.DETAIL_LINE_COUNT
       FROM [VPurchase].[TBL_PURCHASE_ORDER_HDR] H
       LEFT JOIN [VMASTER].[TBL_COMPANY_MASTER] C ON C.COMPANY_ID = H.COMPANY_ID
       LEFT JOIN [VMASTER].[TBL_BUSINESS_PARTNER_MASTER] BP ON BP.BP_ID = H.SUPPLIER_BP_ID
       LEFT JOIN [VMASTER].[TBL_BRANCH_Master] BR ON BR.BRANCH_ID = H.BRANCH_ID
       LEFT JOIN [VMASTER].[TBL_STORE_MASTER] ST ON ST.STORE_ID = H.PO_STORE_ID
       LEFT JOIN [VMASTER].[TBL_CURRENCY_MASTER] CU ON CU.CURRENCY_ID = H.CURRENCY_ID
       LEFT JOIN [VMASTER].[TBL_PAYMENT_TERM_MASTER] PT ON PT.PAYMENT_TERM_ID = H.PAYMENT_TERM_ID
       LEFT JOIN [VMASTER].[TBL_PAYMENT_MODE_MASTER] PM ON PM.PAYMENT_MODE_ID = H.PAYMENT_MODE_ID
       LEFT JOIN [VMASTER].[TBL_STATUS_MASTER] STM ON STM.STATUS_ID = H.PURCHASE_ORDER_STATUS_ID
       OUTER APPLY (
          SELECT COUNT(*) AS INVOICE_COUNT
          FROM [VPurchase].[TBL_PURCHASE_INVOICE_HDR] I
          WHERE I.PURCHASE_ORDER_NO = H.PURCHASE_ORDER_NO
       ) INV
       OUTER APPLY (
          SELECT COUNT(*) AS DETAIL_LINE_COUNT
          FROM [VPurchase].[TBL_PURCHASE_ORDER_DTL] D
          WHERE D.PURCHASE_ORDER_NO = H.PURCHASE_ORDER_NO
       ) DTL
       WHERE (@COMPANY_ID IS NULL OR H.COMPANY_ID = @COMPANY_ID)
         AND UPPER(ISNULL(H.STATUS_ENTRY, '')) = 'CL'
       ORDER BY H.PURCHASE_ORDER_NO DESC`
    );

  const rows = result.recordset || [];
  const orderNos = rows.map((r: any) => String(r.PURCHASE_ORDER_NO ?? "").trim()).filter(Boolean);
  if (orderNos.length === 0) return [];

  const req = pool.request();
  orderNos.forEach((no, i) => req.input(`po${i}`, sql.VarChar(50), no));
  const details = await req.query(
    `SELECT D.PURCHASE_ORDER_NO, D.PURCHASE_ORDER_DTL_ID, D.LINE_NO,
            ISNULL(P.PRODUCT_NAME, '') AS PRODUCT_NAME,
            D.TOTAL_QUANTITY, ISNULL(U.UOM_NAME, '') AS UOM_NAME
       FROM [VPurchase].[TBL_PURCHASE_ORDER_DTL] D
       LEFT JOIN [VMASTER].[TBL_PRODUCT_MASTER] P ON P.PRODUCT_ID = D.PRODUCT_ID
       LEFT JOIN [VMASTER].[TBL_UOM_MASTER] U ON U.UOM_ID = D.UOM_ID
      WHERE D.PURCHASE_ORDER_NO IN (${orderNos.map((_, i) => `@po${i}`).join(",")})
      ORDER BY D.PURCHASE_ORDER_NO, D.LINE_NO`
  );

  const linesByDoc = new Map<string, string[]>();
  for (const d of details.recordset || []) {
    const no = String(d.PURCHASE_ORDER_NO ?? "").trim();
    const name = String(d.PRODUCT_NAME ?? "").trim();
    if (!no || !name) continue;
    const qty = fmtQty(d.TOTAL_QUANTITY);
    const uom = String(d.UOM_NAME ?? "").trim();
    const entry = `${name}${qty ? ` ${qty}${uom ? ` ${uom}` : ""}` : ""}`;
    const list = linesByDoc.get(no) ?? [];
    list.push(entry);
    linesByDoc.set(no, list);
  }

  return rows.map((r: any) => {
    const no = String(r.PURCHASE_ORDER_NO ?? "").trim();
    const lines = linesByDoc.get(no) ?? [];
    const shown = lines.slice(0, 4);
    const rest = lines.length - shown.length;
    const summary = [...shown, ...(rest > 0 ? [`+${rest} more`] : [])].join(" · ");
    return {
      ...r,
      id: no,
      purchaseOrderNo: no,
      purchaseOrderDate: r.PURCHASE_ORDER_DATE,
      companyId: r.COMPANY_ID,
      companyName: r.COMPANY_NAME,
      supplierBpId: r.SUPPLIER_BP_ID,
      supplierName: r.SUPPLIER_NAME,
      branchId: r.BRANCH_ID,
      branchName: r.BRANCH_NAME,
      storeId: r.PO_STORE_ID,
      storeName: r.STORE_NAME,
      currencyId: r.CURRENCY_ID,
      currencyName: r.CURRENCY_NAME,
      exchangeRate: r.EXCHANGE_RATE,
      paymentTermId: r.PAYMENT_TERM_ID,
      paymentTermName: r.PAYMENT_TERM_NAME,
      paymentModeId: r.PAYMENT_MODE_ID,
      paymentModeName: r.PAYMENT_MODE_NAME,
      purchaseOrderStatusId: r.PURCHASE_ORDER_STATUS_ID,
      purchaseOrderStatusName: r.PURCHASE_ORDER_STATUS_NAME,
      statusEntry: r.STATUS_ENTRY,
      invoiceCount: Number(r.INVOICE_COUNT ?? 0),
      detailLineCount: Number(r.DETAIL_LINE_COUNT ?? 0),
      itemSummary: summary,
      label: `${no} - ${r.SUPPLIER_NAME || r.COMPANY_NAME || ""}${
        Number(r.INVOICE_COUNT ?? 0) > 0 ? ` (${r.INVOICE_COUNT} invoice(s))` : ""
      }`,
    };
  });
};

export const getPurchaseInvoiceSourceOrderService = async (poNo: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const header = await pool
    .request()
    .input("PURCHASE_ORDER_NO", sql.VarChar(50), poNo)
    .query(
      `SELECT
          H.PURCHASE_ORDER_NO,
          CONVERT(VARCHAR(10), H.PURCHASE_ORDER_DATE, 23) AS PURCHASE_ORDER_DATE,
          H.COMPANY_ID, H.BRANCH_ID, H.SUPPLIER_BP_ID, H.PO_STORE_ID AS STORE_ID,
          H.CURRENCY_ID, H.EXCHANGE_RATE, H.PAYMENT_TERM_ID, H.PAYMENT_MODE_ID,
          H.STATUS_ENTRY
       FROM [VPurchase].[TBL_PURCHASE_ORDER_HDR] H
       WHERE H.PURCHASE_ORDER_NO = @PURCHASE_ORDER_NO`
    );

  if (!header.recordset?.[0]) throw new Error("Purchase Order not found");

  const details = await pool
    .request()
    .input("PURCHASE_ORDER_NO", sql.VarChar(50), poNo)
    .query(
      `SELECT
          D.PURCHASE_ORDER_DTL_ID, D.PURCHASE_ORDER_NO, D.LINE_NO,
          D.CAMP_ID, D.REQUEST_STORE_ID AS STORE_ID,
          D.MAIN_CATEGORY_ID, D.SUB_CATEGORY_ID, D.PRODUCT_ID,
          ISNULL(P.PRODUCT_NAME, '') AS PRODUCT_NAME,
          D.NO_OF_PCS_PER_PACKING, D.TOTAL_QUANTITY,
          ISNULL(D.TOTAL_QUANTITY - ISNULL(INV.INVOICED_QUANTITY, 0), 0) AS REMAINING_QUANTITY,
          ISNULL(INV.INVOICED_QUANTITY, 0) AS ALREADY_INVOICED_QUANTITY,
          D.UOM_ID, ISNULL(U.UOM_NAME, '') AS UOM_NAME,
          D.ALT_UOM_ID, ISNULL(AU.UOM_NAME, '') AS ALT_UOM_NAME,
          D.RATE AS RATE_FC, D.EXCHANGE_RATE,
          D.DISCOUNT_PERCENTAGE, D.TAX_ID, ISNULL(T.TAX_NAME, '') AS TAX_NAME,
          D.TAX_PERCENTAGE, D.REMARKS
       FROM [VPurchase].[TBL_PURCHASE_ORDER_DTL] D
       LEFT JOIN [VMASTER].[TBL_PRODUCT_MASTER] P ON P.PRODUCT_ID = D.PRODUCT_ID
       LEFT JOIN [VMASTER].[TBL_UOM_MASTER] U ON U.UOM_ID = D.UOM_ID
       LEFT JOIN [VMASTER].[TBL_UOM_MASTER] AU ON AU.UOM_ID = D.ALT_UOM_ID
       LEFT JOIN [VMASTER].[TBL_TAX_MASTER] T ON T.TAX_ID = D.TAX_ID
       OUTER APPLY (
          SELECT SUM(ID.INVOICED_QUANTITY) AS INVOICED_QUANTITY
          FROM [VPurchase].[TBL_PURCHASE_INVOICE_DTL] ID
          WHERE ID.PURCHASE_ORDER_DTL_ID = D.PURCHASE_ORDER_DTL_ID
       ) INV
       WHERE D.PURCHASE_ORDER_NO = @PURCHASE_ORDER_NO
       ORDER BY D.LINE_NO`
    );

  return { header: header.recordset[0], dtls: details.recordset || [] };
};

/* ------------------------------------------------------------- hdr write */
const invoiceHdrRequest = (
  pool: any,
  data: PurchaseInvoiceData,
  refNo: string | null
) =>
  pool
    .request()
    .input("DRAFT_REF_NO", sql.VarChar(50), data.DRAFT_REF_NO || null)
    .input("PURCHASE_INVOICE_REF_NO", sql.VarChar(50), refNo)
    .input("PURCHASE_INVOICE_DATE", sql.DateTime, dateOrNull(data.PURCHASE_INVOICE_DATE))
    .input("PURCHASE_ORDER_NO", sql.VarChar(50), data.PURCHASE_ORDER_NO || null)
    .input("SUPPLIER_INVOICE_NO", sql.VarChar(100), data.SUPPLIER_INVOICE_NO || null)
    .input("SUPPLIER_INVOICE_DATE", sql.DateTime, dateOrNull(data.SUPPLIER_INVOICE_DATE))
    .input("COMPANY_ID", sql.Int, numOrNull(data.COMPANY_ID))
    .input("BRANCH_ID", sql.Int, numOrNull(data.BRANCH_ID))
    .input("CAMP_ID", sql.Int, numOrNull(data.CAMP_ID))
    .input("STORE_ID", sql.Int, numOrNull(data.STORE_ID))
    .input("SUPPLIER_BP_ID", sql.Int, numOrNull(data.SUPPLIER_BP_ID))
    .input("CURRENCY_ID", sql.Int, numOrNull(data.CURRENCY_ID))
    .input("EXCHANGE_RATE", sql.Decimal(15, 6), amtOrNull(data.EXCHANGE_RATE))
    .input("PAYMENT_TERM_ID", sql.Int, numOrNull(data.PAYMENT_TERM_ID))
    .input("PAYMENT_MODE_ID", sql.Int, numOrNull(data.PAYMENT_MODE_ID))
    .input("DUE_DATE", sql.DateTime, dateOrNull(data.DUE_DATE))
    .input("TOTAL_SUB_TOTAL_HDR_AMOUNT_FC", sql.Decimal(15, 3), amtOrNull(data.TOTAL_SUB_TOTAL_HDR_AMOUNT_FC ?? 0))
    .input("TOTAL_DISCOUNT_HDR_AMOUNT_FC", sql.Decimal(15, 3), amtOrNull(data.TOTAL_DISCOUNT_HDR_AMOUNT_FC ?? 0))
    .input("TOTAL_ADDITIONAL_COST_AMOUNT_FC", sql.Decimal(15, 3), amtOrNull(data.TOTAL_ADDITIONAL_COST_AMOUNT_FC ?? 0))
    .input("TOTAL_PRODUCT_HDR_AMOUNT_FC", sql.Decimal(15, 3), amtOrNull(data.TOTAL_PRODUCT_HDR_AMOUNT_FC ?? 0))
    .input("TOTAL_TAX_HDR_AMOUNT_FC", sql.Decimal(15, 3), amtOrNull(data.TOTAL_TAX_HDR_AMOUNT_FC ?? 0))
    .input("FINAL_PRODUCT_HDR_AMOUNT_FC", sql.Decimal(15, 3), amtOrNull(data.FINAL_PRODUCT_HDR_AMOUNT_FC ?? 0))
    .input("TOTAL_SUB_TOTAL_HDR_AMOUNT_LC", sql.Decimal(15, 3), amtOrNull(data.TOTAL_SUB_TOTAL_HDR_AMOUNT_LC ?? 0))
    .input("TOTAL_DISCOUNT_HDR_AMOUNT_LC", sql.Decimal(15, 3), amtOrNull(data.TOTAL_DISCOUNT_HDR_AMOUNT_LC ?? 0))
    .input("TOTAL_ADDITIONAL_COST_AMOUNT_LC", sql.Decimal(15, 3), amtOrNull(data.TOTAL_ADDITIONAL_COST_AMOUNT_LC ?? 0))
    .input("TOTAL_PRODUCT_HDR_AMOUNT_LC", sql.Decimal(15, 3), amtOrNull(data.TOTAL_PRODUCT_HDR_AMOUNT_LC ?? 0))
    .input("TOTAL_TAX_HDR_AMOUNT_LC", sql.Decimal(15, 3), amtOrNull(data.TOTAL_TAX_HDR_AMOUNT_LC ?? 0))
    .input("FINAL_PRODUCT_HDR_AMOUNT_LC", sql.Decimal(15, 3), amtOrNull(data.FINAL_PRODUCT_HDR_AMOUNT_LC ?? 0))
    .input("STATUS_ID", sql.Int, numOrNull(data.STATUS_ID))
    .input("RESPONSE_BY_EMP_ID", sql.Int, numOrNull(data.RESPONSE_BY_EMP_ID))
    .input("RESPONSE_DATE", sql.DateTime, dateOrNull(data.RESPONSE_DATE))
    .input("RESPONSE_REMARKS", sql.VarChar(500), data.RESPONSE_REMARKS || null)
    .input("REMARKS", sql.VarChar(500), data.REMARKS || null)
    .input("LINK_PAGES_ID", sql.Int, numOrNull(data.LINK_PAGES_ID))
    .input("USER", sql.VarChar(50), data.USER || "Admin")
    .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

const invoiceDtlRequest = (
  req: any,
  refNo: string,
  dtl: PurchaseInvoiceDtl,
  user: string,
  mac: string
) =>
  req
    .input("PURCHASE_INVOICE_REF_NO", sql.VarChar(50), refNo)
    .input("LINE_NO", sql.Int, numOrNull(dtl.LINE_NO) ?? 0)
    .input("PURCHASE_ORDER_NO", sql.VarChar(50), dtl.PURCHASE_ORDER_NO || null)
    .input("PURCHASE_ORDER_DTL_ID", sql.Int, numOrNull(dtl.PURCHASE_ORDER_DTL_ID))
    .input("CAMP_ID", sql.Int, numOrNull(dtl.CAMP_ID))
    .input("STORE_ID", sql.Int, numOrNull(dtl.STORE_ID))
    .input("MAIN_CATEGORY_ID", sql.Int, numOrNull(dtl.MAIN_CATEGORY_ID))
    .input("SUB_CATEGORY_ID", sql.Int, numOrNull(dtl.SUB_CATEGORY_ID))
    .input("PRODUCT_ID", sql.Int, numOrNull(dtl.PRODUCT_ID))
    .input("DESCRIPTION", sql.VarChar(500), dtl.DESCRIPTION || null)
    .input("NO_OF_PCS_PER_PACKING", sql.Decimal(15, 3), amtOrNull(dtl.NO_OF_PCS_PER_PACKING))
    .input("INVOICED_QUANTITY", sql.Decimal(15, 3), amtOrNull(dtl.INVOICED_QUANTITY))
    .input("UOM_ID", sql.Int, numOrNull(dtl.UOM_ID))
    .input("ALT_QUANTITY", sql.Decimal(15, 3), amtOrNull(dtl.ALT_QUANTITY))
    .input("ALT_UOM_ID", sql.Int, numOrNull(dtl.ALT_UOM_ID))
    .input("RATE_FC", sql.Decimal(15, 3), amtOrNull(dtl.RATE_FC))
    .input("EXCHANGE_RATE", sql.Decimal(15, 6), amtOrNull(dtl.EXCHANGE_RATE))
    .input("SUB_TOTAL_AMOUNT_FC", sql.Decimal(15, 3), amtOrNull(dtl.SUB_TOTAL_AMOUNT_FC))
    .input("DISCOUNT_PERCENTAGE", sql.Decimal(15, 3), amtOrNull(dtl.DISCOUNT_PERCENTAGE))
    .input("DISCOUNT_AMOUNT_FC", sql.Decimal(15, 3), amtOrNull(dtl.DISCOUNT_AMOUNT_FC))
    .input("TOTAL_PRODUCT_AMOUNT_FC", sql.Decimal(15, 3), amtOrNull(dtl.TOTAL_PRODUCT_AMOUNT_FC))
    .input("TAX_ID", sql.Int, numOrNull(dtl.TAX_ID))
    .input("TAX_PERCENTAGE", sql.Decimal(15, 3), amtOrNull(dtl.TAX_PERCENTAGE))
    .input("TAX_AMOUNT_FC", sql.Decimal(15, 3), amtOrNull(dtl.TAX_AMOUNT_FC))
    .input("FINAL_AMOUNT_FC", sql.Decimal(15, 3), amtOrNull(dtl.FINAL_AMOUNT_FC))
    .input("SUB_TOTAL_AMOUNT_LC", sql.Decimal(15, 3), amtOrNull(dtl.SUB_TOTAL_AMOUNT_LC))
    .input("DISCOUNT_AMOUNT_LC", sql.Decimal(15, 3), amtOrNull(dtl.DISCOUNT_AMOUNT_LC))
    .input("TOTAL_PRODUCT_AMOUNT_LC", sql.Decimal(15, 3), amtOrNull(dtl.TOTAL_PRODUCT_AMOUNT_LC))
    .input("TAX_AMOUNT_LC", sql.Decimal(15, 3), amtOrNull(dtl.TAX_AMOUNT_LC))
    .input("FINAL_AMOUNT_LC", sql.Decimal(15, 3), amtOrNull(dtl.FINAL_AMOUNT_LC))
    .input("REMARKS", sql.VarChar(500), dtl.REMARKS || null)
    .input("USER", sql.VarChar(50), user)
    .input("MAC_ADDRESS", sql.VarChar(50), mac);

const saveInvoiceDtlService = async (
  refNo: string,
  dtl: PurchaseInvoiceDtl,
  user: string,
  mac: string
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const result = await invoiceDtlRequest(pool.request(), refNo, dtl, user, mac).execute(
    "VPurchase.SAVE_PURCHASE_INVOICE_DTL"
  );
  parseSprocResult(result.recordset?.[0], "Failed to save purchase invoice detail");
  return result.recordset?.[0];
};

const updateInvoiceDtlService = async (
  refNo: string,
  dtl: PurchaseInvoiceDtl,
  user: string,
  mac: string
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const result = await invoiceDtlRequest(
    pool
      .request()
      .input("PURCHASE_INVOICE_DTL_ID", sql.Int, numOrNull(dtl.PURCHASE_INVOICE_DTL_ID) ?? 0),
    refNo,
    dtl,
    user,
    mac
  ).execute("VPurchase.UPDATE_PURCHASE_INVOICE_DTL");
  parseSprocResult(result.recordset?.[0], "Failed to update purchase invoice detail");
  return result.recordset?.[0];
};

export const deletePurchaseInvoiceDtlService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const result = await pool
    .request()
    .input("PURCHASE_INVOICE_DTL_ID", sql.Int, id)
    .execute("VPurchase.DELETE_PURCHASE_INVOICE_DTL");

  const { message } = parseSprocResult(
    result.recordset?.[0],
    "Failed to delete purchase invoice detail"
  );
  return { message: message || "Purchase Invoice detail deleted successfully" };
};

const recalcInvoice = async (refNo: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  await pool
    .request()
    .input("PURCHASE_INVOICE_REF_NO", sql.VarChar(50), refNo)
    .execute("VPurchase.TBL_UPDATE_PURCHASE_INVOICE_HDR_VALUES");
};

/* ---------------------------------------------------------------- create */
export const savePurchaseInvoiceCombinedService = async (raw: PurchaseInvoiceData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const dtls = (Array.isArray(raw.dtls) ? raw.dtls : []).map((d) =>
    computeDtlAmounts(d, raw.EXCHANGE_RATE)
  );
  const data = computeHeaderTotals(raw, dtls);

  const result = await invoiceHdrRequest(pool, data, "").execute(
    "VPurchase.SAVE_PURCHASE_INVOICE_HDR"
  );
  const row = pickResultRow(result);
  const { message, data: parsedData } = parseSprocResult(
    row,
    "Failed to save purchase invoice header"
  );
  const refNo = String(parsedData ?? "").trim();
  if (!refNo) {
    throw new Error("Can't Generate Purchase Invoice Reference Number. Contact Admin");
  }

  const user = data.USER || "Admin";
  const mac = data.MAC_ADDRESS || "WEB";
  for (const dtl of dtls) {
    await saveInvoiceDtlService(refNo, { ...dtl, PURCHASE_INVOICE_REF_NO: refNo }, user, mac);
  }

  await recalcInvoice(refNo);

  return {
    message: message || "Purchase Invoice created successfully",
    PURCHASE_INVOICE_REF_NO: refNo,
  };
};

/* ---------------------------------------------------------------- update */
export const updatePurchaseInvoiceCombinedService = async (raw: PurchaseInvoiceData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const refNo = String(raw.PURCHASE_INVOICE_REF_NO ?? "").trim();
  if (!refNo) throw new Error("PURCHASE_INVOICE_REF_NO is required");

  const dtls = (Array.isArray(raw.dtls) ? raw.dtls : []).map((d) =>
    computeDtlAmounts(d, raw.EXCHANGE_RATE)
  );
  const data = computeHeaderTotals(raw, dtls);
  const user = data.USER || "Admin";
  const mac = data.MAC_ADDRESS || "WEB";

  const hdr = await invoiceHdrRequest(pool, data, refNo).execute(
    "VPurchase.UPDATE_PURCHASE_INVOICE_HDR"
  );
  parseSprocResult(pickResultRow(hdr), "Failed to update purchase invoice header");

  for (const id of Array.isArray(raw.deletedIds) ? raw.deletedIds : []) {
    await deletePurchaseInvoiceDtlService(Number(id));
  }

  for (const dtl of dtls) {
    if (dtl.PURCHASE_INVOICE_DTL_ID) {
      await updateInvoiceDtlService(refNo, dtl, user, mac);
    } else {
      await saveInvoiceDtlService(refNo, dtl, user, mac);
    }
  }

  await recalcInvoice(refNo);

  return { message: "Purchase Invoice updated successfully", PURCHASE_INVOICE_REF_NO: refNo };
};

export const deletePurchaseInvoiceHdrService = async (refNo: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const dtlRows = await pool
    .request()
    .input("PURCHASE_INVOICE_REF_NO", sql.VarChar(50), refNo)
    .query(
      "SELECT PURCHASE_INVOICE_DTL_ID FROM [VPurchase].[TBL_PURCHASE_INVOICE_DTL] WHERE PURCHASE_INVOICE_REF_NO = @PURCHASE_INVOICE_REF_NO"
    );
  for (const row of dtlRows.recordset || []) {
    await deletePurchaseInvoiceDtlService(Number(row.PURCHASE_INVOICE_DTL_ID));
  }

  const chargeRows = await pool
    .request()
    .input("PURCHASE_INVOICE_REF_NO", sql.VarChar(50), refNo)
    .query(
      "SELECT PURCHASE_INVOICE_ADDITIONAL_CHARGES_DTL_ID FROM [VPurchase].[TBL_PURCHASE_INVOICE_ADDITIONAL_CHARGES_DTL] WHERE PURCHASE_INVOICE_REF_NO = @PURCHASE_INVOICE_REF_NO"
    );
  for (const row of chargeRows.recordset || []) {
    await pool
      .request()
      .input("PURCHASE_INVOICE_ADDITIONAL_CHARGES_DTL_ID", sql.Int, Number(row.PURCHASE_INVOICE_ADDITIONAL_CHARGES_DTL_ID))
      .execute("VPurchase.DELETE_PURCHASE_INVOICE_ADDITIONAL_CHARGES_DTL");
  }

  const result = await pool
    .request()
    .input("PURCHASE_INVOICE_REF_NO", sql.VarChar(50), refNo)
    .execute("VPurchase.DELETE_PURCHASE_INVOICE_HDR");

  const { message } = parseSprocResult(
    result.recordset?.[0],
    "Failed to delete purchase invoice"
  );

  /* The conversation thread goes with the invoice, so no reply is left
     pointing at a document that no longer exists. */
  await deletePurchaseInvoiceConversationsByRefService(refNo, PURCHASE_INVOICE_LINK_PAGES_ID);

  return { message: message || "Purchase Invoice deleted successfully" };
};

/* ------------------------------------------------- additional charges */
export const getPurchaseInvoiceAdditionalChargesService = async (refNo: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const result = await pool
    .request()
    .input("PURCHASE_INVOICE_REF_NO", sql.VarChar(50), refNo)
    .execute("VPurchase.SHOW_PURCHASE_INVOICE_ADDITIONAL_CHARGES_DTL");

  return (result.recordset || []).map((row: any) => ({
    ...row,
    PURCHASE_INVOICE_ADDITIONAL_CHARGES_DTL_ID:
      row.PURCHASE_INVOICE_ADDITIONAL_CHARGES_DTL_ID ?? row.ID ?? row.Id,
  }));
};

export const getPurchaseInvoiceAdditionalChargeService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const result = await pool
    .request()
    .input("PURCHASE_INVOICE_ADDITIONAL_CHARGES_DTL_ID", sql.Int, id)
    .execute("VPurchase.GET_PURCHASE_INVOICE_ADDITIONAL_CHARGES_DTL");

  const row = result.recordset?.[0] || null;
  if (!row) throw new Error("Purchase Invoice additional charge not found");
  return row;
};

const fetchInvoiceExchangeRate = async (refNo: string): Promise<number | null> => {
  const pool = getPool();
  if (!pool) return null;
  const result = await pool
    .request()
    .input("PURCHASE_INVOICE_REF_NO", sql.VarChar(50), refNo)
    .query(
      "SELECT EXCHANGE_RATE FROM [VPurchase].[TBL_PURCHASE_INVOICE_HDR] WHERE PURCHASE_INVOICE_REF_NO = @PURCHASE_INVOICE_REF_NO"
    );
  const rate = result.recordset?.[0]?.EXCHANGE_RATE;
  return rate === undefined || rate === null || rate === "" ? null : Number(rate);
};

const resolveTaxPercentage = async (data: PurchaseInvoiceAdditionalChargeData): Promise<number> => {
  if (data.TAX_PERCENTAGE !== undefined && data.TAX_PERCENTAGE !== null && data.TAX_PERCENTAGE !== "") {
    return Number(data.TAX_PERCENTAGE);
  }
  if (data.TAX_ID) {
    const pool = getPool();
    if (pool) {
      const result = await pool
        .request()
        .input("TAX_ID", sql.Int, data.TAX_ID)
        .query("SELECT TAX_PERCENTAGE FROM [VMASTER].[TBL_TAX_MASTER] WHERE TAX_ID = @TAX_ID");
      const pct = result.recordset?.[0]?.TAX_PERCENTAGE;
      if (pct !== undefined && pct !== null) return Number(pct);
    }
  }
  return 0;
};

const computeChargeAmounts = (
  charge: PurchaseInvoiceAdditionalChargeData,
  exchangeRate: number
): PurchaseInvoiceAdditionalChargeData => {
  const qty = toNum(charge.QUANTITY);
  const rate = toNum(charge.RATE_FC);
  const taxPct = toNum(charge.TAX_PERCENTAGE);
  const exRate = exchangeRate || 0;

  const totalFc = r3(qty * rate);
  const taxFc = r3((totalFc * taxPct) / 100);
  const finalFc = r3(totalFc + taxFc);

  return {
    ...charge,
    AMOUNT_FC: totalFc,
    TAX_AMOUNT_FC: taxFc,
    FINAL_AMOUNT_FC: finalFc,
    AMOUNT_LC: r3(totalFc * exRate),
    TAX_AMOUNT_LC: r3(taxFc * exRate),
    FINAL_AMOUNT_LC: r3(finalFc * exRate),
  };
};

/* additional charges use RATE_FC but have no EXCHANGE_RATE column; the caller
   supplies it, otherwise the header rate is used. */
export type PurchaseInvoiceAdditionalChargeInput = PurchaseInvoiceAdditionalChargeData;

export const savePurchaseInvoiceAdditionalChargeService = async (
  data: PurchaseInvoiceAdditionalChargeInput
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const headerRate = await fetchInvoiceExchangeRate(data.PURCHASE_INVOICE_REF_NO);
  const taxPercentage = await resolveTaxPercentage(data);
  const exchangeRate = amtOrNull(data.EXCHANGE_RATE) ?? headerRate ?? 0;
  const charge = computeChargeAmounts(
    { ...data, TAX_PERCENTAGE: taxPercentage },
    exchangeRate
  );

  const result = await pool
    .request()
    .input("PURCHASE_INVOICE_REF_NO", sql.VarChar(50), charge.PURCHASE_INVOICE_REF_NO)
    .input("LINE_NO", sql.Int, numOrNull(charge.LINE_NO) ?? 0)
    .input("ADDITIONAL_CHARGE_TYPE_ID", sql.Int, numOrNull(charge.ADDITIONAL_CHARGE_TYPE_ID))
    .input("DESCRIPTION", sql.VarChar(500), charge.DESCRIPTION || null)
    .input("QUANTITY", sql.Decimal(15, 3), amtOrNull(charge.QUANTITY))
    .input("UOM_ID", sql.Int, numOrNull(charge.UOM_ID))
    .input("RATE_FC", sql.Decimal(15, 3), amtOrNull(charge.RATE_FC))
    .input("AMOUNT_FC", sql.Decimal(15, 3), amtOrNull(charge.AMOUNT_FC))
    .input("TAX_ID", sql.Int, numOrNull(charge.TAX_ID))
    .input("TAX_PERCENTAGE", sql.Decimal(15, 3), amtOrNull(charge.TAX_PERCENTAGE))
    .input("TAX_AMOUNT_FC", sql.Decimal(15, 3), amtOrNull(charge.TAX_AMOUNT_FC))
    .input("FINAL_AMOUNT_FC", sql.Decimal(15, 3), amtOrNull(charge.FINAL_AMOUNT_FC))
    .input("AMOUNT_LC", sql.Decimal(15, 3), amtOrNull(charge.AMOUNT_LC))
    .input("TAX_AMOUNT_LC", sql.Decimal(15, 3), amtOrNull(charge.TAX_AMOUNT_LC))
    .input("FINAL_AMOUNT_LC", sql.Decimal(15, 3), amtOrNull(charge.FINAL_AMOUNT_LC))
    .input("REMARKS", sql.VarChar(500), charge.REMARKS || null)
    .input("USER", sql.VarChar(50), charge.USER || "Admin")
    .input("MAC_ADDRESS", sql.VarChar(50), charge.MAC_ADDRESS || "WEB")
    .execute("VPurchase.SAVE_PURCHASE_INVOICE_ADDITIONAL_CHARGES_DTL");

  const { message, data: id } = parseSprocResult(
    result.recordset?.[0],
    "Failed to save additional charge"
  );

  return { message: message || "Additional Charge saved successfully", id: Number(id) || null };
};

export const updatePurchaseInvoiceAdditionalChargeService = async (
  data: PurchaseInvoiceAdditionalChargeInput
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const headerRate = await fetchInvoiceExchangeRate(data.PURCHASE_INVOICE_REF_NO);
  const taxPercentage = await resolveTaxPercentage(data);
  const exchangeRate = amtOrNull(data.EXCHANGE_RATE) ?? headerRate ?? 0;
  const charge = computeChargeAmounts(
    { ...data, TAX_PERCENTAGE: taxPercentage },
    exchangeRate
  );

  const result = await pool
    .request()
    .input("PURCHASE_INVOICE_ADDITIONAL_CHARGES_DTL_ID", sql.Int, charge.PURCHASE_INVOICE_ADDITIONAL_CHARGES_DTL_ID ?? 0)
    .input("PURCHASE_INVOICE_REF_NO", sql.VarChar(50), charge.PURCHASE_INVOICE_REF_NO)
    .input("LINE_NO", sql.Int, numOrNull(charge.LINE_NO) ?? 0)
    .input("ADDITIONAL_CHARGE_TYPE_ID", sql.Int, numOrNull(charge.ADDITIONAL_CHARGE_TYPE_ID))
    .input("DESCRIPTION", sql.VarChar(500), charge.DESCRIPTION || null)
    .input("QUANTITY", sql.Decimal(15, 3), amtOrNull(charge.QUANTITY))
    .input("UOM_ID", sql.Int, numOrNull(charge.UOM_ID))
    .input("RATE_FC", sql.Decimal(15, 3), amtOrNull(charge.RATE_FC))
    .input("AMOUNT_FC", sql.Decimal(15, 3), amtOrNull(charge.AMOUNT_FC))
    .input("TAX_ID", sql.Int, numOrNull(charge.TAX_ID))
    .input("TAX_PERCENTAGE", sql.Decimal(15, 3), amtOrNull(charge.TAX_PERCENTAGE))
    .input("TAX_AMOUNT_FC", sql.Decimal(15, 3), amtOrNull(charge.TAX_AMOUNT_FC))
    .input("FINAL_AMOUNT_FC", sql.Decimal(15, 3), amtOrNull(charge.FINAL_AMOUNT_FC))
    .input("AMOUNT_LC", sql.Decimal(15, 3), amtOrNull(charge.AMOUNT_LC))
    .input("TAX_AMOUNT_LC", sql.Decimal(15, 3), amtOrNull(charge.TAX_AMOUNT_LC))
    .input("FINAL_AMOUNT_LC", sql.Decimal(15, 3), amtOrNull(charge.FINAL_AMOUNT_LC))
    .input("REMARKS", sql.VarChar(500), charge.REMARKS || null)
    .input("USER", sql.VarChar(50), charge.USER || "Admin")
    .input("MAC_ADDRESS", sql.VarChar(50), charge.MAC_ADDRESS || "WEB")
    .execute("VPurchase.UPDATE_PURCHASE_INVOICE_ADDITIONAL_CHARGES_DTL");

  const { message } = parseSprocResult(
    result.recordset?.[0],
    "Failed to update additional charge"
  );
  return { message: message || "Additional Charge updated successfully" };
};

export const deletePurchaseInvoiceAdditionalChargeService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const result = await pool
    .request()
    .input("PURCHASE_INVOICE_ADDITIONAL_CHARGES_DTL_ID", sql.Int, id)
    .execute("VPurchase.DELETE_PURCHASE_INVOICE_ADDITIONAL_CHARGES_DTL");

  const { message } = parseSprocResult(
    result.recordset?.[0],
    "Failed to delete additional charge"
  );
  return { message: message || "Additional Charge deleted successfully" };
};
