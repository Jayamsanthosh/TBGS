import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult, pickResultRow } from "../utils/sprocResult";

export interface PurchaseGrnDtl {
  key?: string;
  PURCHASE_GRN_DTL_ID?: number;
  PURCHASE_GRN_REF_NO?: string;
  PURCHASE_ORDER_NO?: string;
  PURCHASE_ORDER_DTL_ID?: number;
  LINE_NO?: number;
  MAIN_CATEGORY_ID?: number;
  SUB_CATEGORY_ID?: number;
  PRODUCT_ID?: number;
  NO_OF_PCS_PER_PACKING?: any;
  PO_QUANTITY?: any;
  ALREADY_RECEIVED_QTY?: any;
  BALANCE_TO_RECEIVE_QTY?: any;
  RECEIVED_QUANTITY?: any;
  REJECTED_QUANTITY?: any;
  ACCEPTED_QUANTITY?: any;
  UOM_ID?: number;
  ALT_QUANTITY?: any;
  ALT_UOM_ID?: number;
  RATE_FC?: any;
  TOTAL_COST_FC?: any;
  EXCHANGE_RATE?: any;
  RATE_LC?: any;
  TOTAL_COST_LC?: any;
  BATCH_NO?: string;
  SERIAL_NO?: string;
  MANUFACTURE_DATE?: string;
  EXPIRY_DATE?: string;
  RACK_ID?: number;
  REJECTION_REMARKS?: string;
  REMARKS?: string;
  STATUS_ENTRY?: string;
  BATCH_MAPPED_QUANTITY?: any;
  BALANCE_TO_MAP_BATCH_QTY?: any;
}

export interface PurchaseGrnData {
  id?: string | number;
  SNO?: number;
  PURCHASE_GRN_REF_NO?: string;
  grnNo?: string;
  refNo?: string;
  PURCHASE_GRN_DATE?: string;
  PURCHASE_ORDER_NO?: string;
  COMPANY_ID?: number | null;
  CAMP_ID?: number | null;
  STORE_ID?: number | null;
  LOCATION_ID?: number | null;
  SUPPLIER_BP_ID?: number | null;
  SUPPLIER_DELIVERY_NOTE_NO?: string;
  SUPPLIER_DELIVERY_NOTE_DATE?: string;
  CURRENCY_ID?: number | null;
  EXCHANGE_RATE?: any;
  TOTAL_QUANTITY?: any;
  TOTAL_VALUE_FC?: any;
  TOTAL_VALUE_LC?: any;
  STATUS_ID?: number | null;
  RESPONSE_BY_EMP_ID?: number | null;
  RESPONSE_DATE?: string;
  RESPONSE_REMARKS?: string;
  REMARKS?: string;
  LINK_PAGES_ID?: number | null;
  STATUS_ENTRY?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
  dtls?: PurchaseGrnDtl[];
  deletedIds?: number[];
}

export interface PurchaseGrnListFilter {
  companyId?: number | null;
}

const dateOrNull = (v: any): Date | null => (v ? new Date(v) : null);

const numOrNull = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

const toNum = (v: any): number => {
  if (v === "" || v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
};

const r3 = (n: number) => Math.round(n * 1000) / 1000;

/* ------------------------------------------------------------------ */
/* The SAVE/UPDATE procs only store the amount columns they are given -   */
/* they never calculate. Every line amount is derived here per the DDL:   */
/*                                                                        */
/*   ACCEPTED_QUANTITY       = RECEIVED_QUANTITY - REJECTED_QUANTITY      */
/*   ALT_QUANTITY            = ACCEPTED_QUANTITY / NO_OF_PCS_PER_PACKING  */
/*   TOTAL_COST_FC           = ACCEPTED_QUANTITY x RATE_FC                */
/*   RATE_LC                 = RATE_FC x EXCHANGE_RATE                    */
/*   TOTAL_COST_LC           = TOTAL_COST_FC x EXCHANGE_RATE              */
/*   BALANCE_TO_RECEIVE_QTY  = PO_QUANTITY - ALREADY_RECEIVED_QTY         */
/* ------------------------------------------------------------------ */
const computeDtlAmounts = (dtl: PurchaseGrnDtl, headerRate: any): PurchaseGrnDtl => {
  const pcs = toNum(dtl.NO_OF_PCS_PER_PACKING);
  const poQty = amtOrNull(dtl.PO_QUANTITY);
  const already = amtOrNull(dtl.ALREADY_RECEIVED_QTY) ?? 0;
  const received = toNum(dtl.RECEIVED_QUANTITY);
  const rejected = toNum(dtl.REJECTED_QUANTITY);
  const rate = toNum(dtl.RATE_FC);
  const exRate = amtOrNull(dtl.EXCHANGE_RATE) ?? amtOrNull(headerRate) ?? 0;

  const accepted = r3(received - rejected);
  const totalCostFc = r3(accepted * rate);
  const rateLc = r3(rate * exRate);
  const totalCostLc = r3(totalCostFc * exRate);

  /* Batch mapping progress: the quantity of this line already allocated to
     batches in the Batch tab, and what is left to map. Both come from the
     client (which mirrors TBL_BATCH_MASTER); the balance is derived here. */
  const batchMapped = amtOrNull(dtl.BATCH_MAPPED_QUANTITY) ?? 0;
  const balanceToMap = r3(accepted - batchMapped);

  const balance =
    amtOrNull(dtl.BALANCE_TO_RECEIVE_QTY) ??
    (poQty === null ? null : r3(poQty - already));

  return {
    ...dtl,
    ALREADY_RECEIVED_QTY: already,
    BALANCE_TO_RECEIVE_QTY: balance,
    ACCEPTED_QUANTITY: accepted,
    ALT_QUANTITY: pcs > 0 ? r3(accepted / pcs) : amtOrNull(dtl.ALT_QUANTITY),
    EXCHANGE_RATE: exRate,
    TOTAL_COST_FC: totalCostFc,
    RATE_LC: rateLc,
    TOTAL_COST_LC: totalCostLc,
    BATCH_MAPPED_QUANTITY: batchMapped,
    BALANCE_TO_MAP_BATCH_QTY: balanceToMap,
  };
};

/* amount / rate helper - keeps 0 as a real 0, blanks as NULL */
const amtOrNull = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

/* Header roll-up: the header SAVE/UPDATE store the totals as given, so the
   sums are recomputed from the saved lines here and passed along. */
const computeHeaderTotals = (data: PurchaseGrnData, lines: PurchaseGrnDtl[]) => ({
  ...data,
  TOTAL_QUANTITY: r3(lines.reduce((a, l) => a + toNum(l.RECEIVED_QUANTITY), 0)),
  TOTAL_VALUE_FC: r3(lines.reduce((a, l) => a + toNum(l.TOTAL_COST_FC), 0)),
  TOTAL_VALUE_LC: r3(lines.reduce((a, l) => a + toNum(l.TOTAL_COST_LC), 0)),
});

/* -------------------------------------------------------------- list */
/* No report/list proc exists, so the grid reads the header table directly
   and LEFT JOINs the masters for the display names. Company filtering is
   optional. */
export const getPurchaseGrnListService = async (filter: PurchaseGrnListFilter = {}) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input(
        "COMPANY_ID",
        sql.Int,
        filter.companyId == null || Number.isNaN(Number(filter.companyId)) ? null : Number(filter.companyId)
      )
      .query(
        `SELECT
           H.SNO,
           H.PURCHASE_GRN_REF_NO,
           H.PURCHASE_GRN_DATE,
           H.PURCHASE_ORDER_NO,
           H.COMPANY_ID,
           C.COMPANY_NAME,
           H.CAMP_ID,
           CP.CAMP_NAME,
           H.STORE_ID,
           ST.STORE_NAME,
           H.LOCATION_ID,
           L.LOCATION_NAME,
           H.SUPPLIER_BP_ID,
           BP.BP_NAME AS SUPPLIER_NAME,
           H.SUPPLIER_DELIVERY_NOTE_NO,
           H.SUPPLIER_DELIVERY_NOTE_DATE,
           H.CURRENCY_ID,
           CU.CURRENCY_NAME,
           H.EXCHANGE_RATE,
           H.TOTAL_QUANTITY,
           H.TOTAL_VALUE_FC,
           H.TOTAL_VALUE_LC,
           H.STATUS_ID,
           S.STATUS_NAME,
           H.STATUS_ENTRY,
           H.REMARKS,
           H.LINK_PAGES_ID,
           H.RESPONSE_BY_EMP_ID,
           H.RESPONSE_DATE,
           H.RESPONSE_REMARKS,
           H.CREATED_BY
         FROM [VInventory].[TBL_PURCHASE_GRN_HDR] H
         LEFT JOIN [VMaster].[TBL_COMPANY_MASTER] C ON C.COMPANY_ID = H.COMPANY_ID
         LEFT JOIN [VMaster].[TBL_CAMP_MASTER] CP ON CP.CAMP_ID = H.CAMP_ID
         LEFT JOIN [VMaster].[TBL_STORE_MASTER] ST ON ST.STORE_ID = H.STORE_ID
         LEFT JOIN [VMaster].[TBL_LOCATION_MASTER] L ON L.LOCATION_ID = H.LOCATION_ID
         LEFT JOIN [VMaster].[TBL_BUSINESS_PARTNER_MASTER] BP ON BP.BP_ID = H.SUPPLIER_BP_ID
         LEFT JOIN [VMaster].[TBL_CURRENCY_MASTER] CU ON CU.CURRENCY_ID = H.CURRENCY_ID
         LEFT JOIN [VMaster].[TBL_STATUS_MASTER] S ON S.STATUS_ID = H.STATUS_ID
         WHERE (@COMPANY_ID IS NULL OR H.COMPANY_ID = @COMPANY_ID)
         ORDER BY H.PURCHASE_GRN_DATE DESC, H.PURCHASE_GRN_REF_NO DESC`
      );

    return (result.recordset || []).map((r: any) => ({
      ...r,
      id: r.SNO,
      grnNo: r.PURCHASE_GRN_REF_NO,
      PURCHASE_ORDER_NO: r.PURCHASE_ORDER_NO,
      grnDate: r.PURCHASE_GRN_DATE,
      companyName: r.COMPANY_NAME,
      campName: r.CAMP_NAME,
      storeName: r.STORE_NAME,
      locationName: r.LOCATION_NAME,
      supplierName: r.SUPPLIER_NAME,
      currencyName: r.CURRENCY_NAME,
      statusName: r.STATUS_NAME,
    }));
  } catch (error) {
    console.error("PURCHASE_GRN list query error:", error);
    throw error;
  }
};

/* --------------------------------------------------------- single header */
export const getPurchaseGrnHdrService = async (refNo: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PURCHASE_GRN_REF_NO", sql.VarChar(50), refNo)
      .execute("VInventory.GET_PURCHASE_GRN_HDR");

    const row = result.recordset?.[0] || null;
    if (!row) throw new Error("Purchase GRN header not found");
    return row;
  } catch (error) {
    console.error("GET_PURCHASE_GRN_HDR SP error:", error);
    throw error;
  }
};

/* -------------------------------------------------------------- details */
export const getPurchaseGrnDtlsService = async (refNo: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PURCHASE_GRN_REF_NO", sql.VarChar(50), refNo)
      .execute("VInventory.SHOW_PURCHASE_GRN_DTL");

    /* SHOW_PURCHASE_GRN_DTL has no ORDER BY, so the lines are put into the
       order the UI expects here. */
    return (result.recordset || []).sort(
      (a: any, b: any) => toNum(a.LINE_NO) - toNum(b.LINE_NO)
    );
  } catch (error) {
    console.error("SHOW_PURCHASE_GRN_DTL SP error:", error);
    throw error;
  }
};

export const getPurchaseGrnDtlService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PURCHASE_GRN_DTL_ID", sql.Int, id)
      .execute("VInventory.GET_PURCHASE_GRN_DTL");

    const row = result.recordset?.[0] || null;
    if (!row) throw new Error("Purchase GRN detail not found");
    return row;
  } catch (error) {
    console.error("GET_PURCHASE_GRN_DTL SP error:", error);
    throw error;
  }
};

/* Shared DTL input chain - the column order must match the deployed
   SAVE/UPDATE_PURCHASE_GRN_DTL signatures exactly (node-mssql binds the
   inputs positionally). UPDATE primes @PURCHASE_GRN_DTL_ID first. */
const grnDtlRequest = (
  req: any,
  refNo: string,
  dtl: PurchaseGrnDtl,
  data: PurchaseGrnData
) => {
  const c = computeDtlAmounts(dtl, data.EXCHANGE_RATE);
  return req
    .input("PURCHASE_GRN_REF_NO", sql.VarChar(50), refNo)
    .input("PURCHASE_ORDER_NO", sql.VarChar(50), c.PURCHASE_ORDER_NO || data.PURCHASE_ORDER_NO || null)
    .input("PURCHASE_ORDER_DTL_ID", sql.Int, numOrNull(c.PURCHASE_ORDER_DTL_ID))
    .input("LINE_NO", sql.Int, numOrNull(c.LINE_NO) ?? 0)
    .input("MAIN_CATEGORY_ID", sql.Int, numOrNull(c.MAIN_CATEGORY_ID))
    .input("SUB_CATEGORY_ID", sql.Int, numOrNull(c.SUB_CATEGORY_ID))
    .input("PRODUCT_ID", sql.Int, numOrNull(c.PRODUCT_ID))
    .input("NO_OF_PCS_PER_PACKING", sql.Decimal(15, 3), numOrNull(c.NO_OF_PCS_PER_PACKING))
    .input("PO_QUANTITY", sql.Decimal(15, 3), numOrNull(c.PO_QUANTITY))
    .input("ALREADY_RECEIVED_QTY", sql.Decimal(15, 3), toNum(c.ALREADY_RECEIVED_QTY))
    .input("BALANCE_TO_RECEIVE_QTY", sql.Decimal(15, 3), toNum(c.BALANCE_TO_RECEIVE_QTY))
    .input("RECEIVED_QUANTITY", sql.Decimal(15, 3), toNum(c.RECEIVED_QUANTITY))
    .input("REJECTED_QUANTITY", sql.Decimal(15, 3), toNum(c.REJECTED_QUANTITY))
    .input("ACCEPTED_QUANTITY", sql.Decimal(15, 3), toNum(c.ACCEPTED_QUANTITY))
    .input("UOM_ID", sql.Int, numOrNull(c.UOM_ID))
    .input("ALT_QUANTITY", sql.Decimal(15, 3), numOrNull(c.ALT_QUANTITY))
    .input("ALT_UOM_ID", sql.Int, numOrNull(c.ALT_UOM_ID))
    .input("RATE_FC", sql.Decimal(15, 3), numOrNull(c.RATE_FC))
    .input("TOTAL_COST_FC", sql.Decimal(15, 3), numOrNull(c.TOTAL_COST_FC))
    .input("EXCHANGE_RATE", sql.Decimal(15, 6), numOrNull(c.EXCHANGE_RATE))
    .input("RATE_LC", sql.Decimal(15, 3), numOrNull(c.RATE_LC))
    .input("TOTAL_COST_LC", sql.Decimal(15, 3), numOrNull(c.TOTAL_COST_LC))
    .input("BATCH_NO", sql.VarChar(100), c.BATCH_NO || null)
    .input("SERIAL_NO", sql.VarChar(100), c.SERIAL_NO || null)
    .input("MANUFACTURE_DATE", sql.DateTime, dateOrNull(c.MANUFACTURE_DATE))
    .input("EXPIRY_DATE", sql.DateTime, dateOrNull(c.EXPIRY_DATE))
    .input("RACK_ID", sql.Int, numOrNull(c.RACK_ID))
    .input("REJECTION_REMARKS", sql.VarChar(500), c.REJECTION_REMARKS || null)
    .input("REMARKS", sql.VarChar(500), c.REMARKS || null)
    .input("STATUS_ENTRY", sql.VarChar(20), c.STATUS_ENTRY || null)
    .input("USER", sql.VarChar(50), data.USER || "Admin")
    .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
    .input("BATCH_MAPPED_QUANTITY", sql.Decimal(15, 3), toNum(c.BATCH_MAPPED_QUANTITY))
    .input("BALANCE_TO_MAP_BATCH_QTY", sql.Decimal(15, 3), toNum(c.BALANCE_TO_MAP_BATCH_QTY));
};

/* ------------------------------------------------------------- dtl save */
const savePurchaseGrnDtlService = async (
  refNo: string,
  dtl: PurchaseGrnDtl,
  data: PurchaseGrnData
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const result = await grnDtlRequest(
    pool.request(),
    refNo,
    { ...dtl, STATUS_ENTRY: dtl.STATUS_ENTRY || "AC" },
    data
  ).execute("VInventory.SAVE_PURCHASE_GRN_DTL");

  const row = pickResultRow(result);
  parseSprocResult(row, "Failed to save purchase GRN detail");
  return row;
};

/* ------------------------------------------------------------ dtl update */
const updatePurchaseGrnDtlService = async (
  refNo: string,
  dtl: PurchaseGrnDtl,
  data: PurchaseGrnData
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const base = pool
    .request()
    .input("PURCHASE_GRN_DTL_ID", sql.Int, numOrNull(dtl.PURCHASE_GRN_DTL_ID) ?? 0);

  const result = await grnDtlRequest(base, refNo, dtl, data).execute(
    "VInventory.UPDATE_PURCHASE_GRN_DTL"
  );

  const row = pickResultRow(result);
  parseSprocResult(row, "Failed to update purchase GRN detail");
  return row;
};

/* -------------------------------------------------------- dtl deletion */
export const deletePurchaseGrnDtlService = async (
  id: number,
  user: string,
  role: string,
  macAddress: string
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PURCHASE_GRN_DTL_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VInventory.DELETE_PURCHASE_GRN_DTL");

    const { message } = parseSprocResult(pickResultRow(result), "Failed to delete purchase GRN detail");
    return { message: message || "Purchase GRN detail deleted successfully" };
  } catch (error) {
    console.error("DELETE_PURCHASE_GRN_DTL SP error:", error);
    throw error;
  }
};

/* Header input chain - must match SAVE/UPDATE_PURCHASE_GRN_HDR (UPDATE primes
   @SNO first). */
const grnHdrRequest = (
  pool: any,
  data: PurchaseGrnData,
  refNo: string | null
) => {
  const derived = computeHeaderTotals(
    data,
    (data.dtls || []).map((d) => computeDtlAmounts(d, data.EXCHANGE_RATE))
  );

  return pool
    .request()
    .input("PURCHASE_GRN_REF_NO", sql.VarChar(50), refNo)
    .input("PURCHASE_GRN_DATE", sql.DateTime, dateOrNull(derived.PURCHASE_GRN_DATE))
    .input("PURCHASE_ORDER_NO", sql.VarChar(50), derived.PURCHASE_ORDER_NO || null)
    .input("COMPANY_ID", sql.Int, numOrNull(derived.COMPANY_ID))
    .input("CAMP_ID", sql.Int, numOrNull(derived.CAMP_ID))
    .input("STORE_ID", sql.Int, numOrNull(derived.STORE_ID))
    .input("LOCATION_ID", sql.Int, numOrNull(derived.LOCATION_ID))
    .input("SUPPLIER_BP_ID", sql.Int, numOrNull(derived.SUPPLIER_BP_ID))
    .input("SUPPLIER_DELIVERY_NOTE_NO", sql.VarChar(100), derived.SUPPLIER_DELIVERY_NOTE_NO || null)
    .input("SUPPLIER_DELIVERY_NOTE_DATE", sql.DateTime, dateOrNull(derived.SUPPLIER_DELIVERY_NOTE_DATE))
    .input("CURRENCY_ID", sql.Int, numOrNull(derived.CURRENCY_ID))
    .input("EXCHANGE_RATE", sql.Decimal(15, 6), numOrNull(derived.EXCHANGE_RATE))
    .input("TOTAL_QUANTITY", sql.Decimal(15, 3), numOrNull(derived.TOTAL_QUANTITY))
    .input("TOTAL_VALUE_FC", sql.Decimal(15, 3), numOrNull(derived.TOTAL_VALUE_FC))
    .input("TOTAL_VALUE_LC", sql.Decimal(15, 3), numOrNull(derived.TOTAL_VALUE_LC))
    .input("STATUS_ID", sql.Int, numOrNull(derived.STATUS_ID))
    .input("RESPONSE_BY_EMP_ID", sql.Int, numOrNull(derived.RESPONSE_BY_EMP_ID))
    .input("RESPONSE_DATE", sql.DateTime, dateOrNull(derived.RESPONSE_DATE))
    .input("RESPONSE_REMARKS", sql.VarChar(500), derived.RESPONSE_REMARKS || null)
    .input("REMARKS", sql.VarChar(500), derived.REMARKS || null)
    .input("LINK_PAGES_ID", sql.Int, numOrNull(derived.LINK_PAGES_ID))
    .input("STATUS_ENTRY", sql.VarChar(20), derived.STATUS_ENTRY || null)
    .input("USER", sql.VarChar(50), derived.USER || "Admin")
    .input("MAC_ADDRESS", sql.VarChar(50), derived.MAC_ADDRESS || "WEB");
};

/* ----------------------------------------------------- combined save */
export const savePurchaseGrnCombinedService = async (raw: PurchaseGrnData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const dtls = (Array.isArray(raw.dtls) ? raw.dtls : []).map((d) =>
      computeDtlAmounts(d, raw.EXCHANGE_RATE)
    );

    const hdrResult = await grnHdrRequest(
      pool,
      { ...raw, dtls, STATUS_ENTRY: raw.STATUS_ENTRY || "CF" },
      ""
    ).execute("VInventory.SAVE_PURCHASE_GRN_HDR");

    const { message, data: parsedData } = parseSprocResult(
      pickResultRow(hdrResult),
      "Failed to save purchase GRN header"
    );
    const refNo = String(parsedData ?? raw.PURCHASE_GRN_REF_NO ?? "").trim();

    if (!refNo) {
      throw new Error("Can't Generate Purchase GRN Reference Number. Contact Admin");
    }

    for (const dtl of dtls) {
      await savePurchaseGrnDtlService(refNo, dtl, raw);
    }

    return { message: message || "Purchase GRN created successfully", PURCHASE_GRN_REF_NO: refNo };
  } catch (error) {
    console.error("SAVE_PURCHASE_GRN_HDR/DTL combined error:", error);
    throw error;
  }
};

/* --------------------------------------------------- combined update */
export const updatePurchaseGrnCombinedService = async (raw: PurchaseGrnData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const refNo = String(raw.PURCHASE_GRN_REF_NO || "").trim();
  if (!refNo) throw new Error("Purchase GRN Reference No is required");

  try {
    const dtls = (Array.isArray(raw.dtls) ? raw.dtls : []).map((d) =>
      computeDtlAmounts(d, raw.EXCHANGE_RATE)
    );

    const hdrResult = await pool
      .request()
      .input("SNO", sql.Int, numOrNull(raw.SNO) ?? 0)
      .input("PURCHASE_GRN_REF_NO", sql.VarChar(50), refNo)
      .input("PURCHASE_GRN_DATE", sql.DateTime, dateOrNull(raw.PURCHASE_GRN_DATE))
      .input("PURCHASE_ORDER_NO", sql.VarChar(50), raw.PURCHASE_ORDER_NO || null)
      .input("COMPANY_ID", sql.Int, numOrNull(raw.COMPANY_ID))
      .input("CAMP_ID", sql.Int, numOrNull(raw.CAMP_ID))
      .input("STORE_ID", sql.Int, numOrNull(raw.STORE_ID))
      .input("LOCATION_ID", sql.Int, numOrNull(raw.LOCATION_ID))
      .input("SUPPLIER_BP_ID", sql.Int, numOrNull(raw.SUPPLIER_BP_ID))
      .input("SUPPLIER_DELIVERY_NOTE_NO", sql.VarChar(100), raw.SUPPLIER_DELIVERY_NOTE_NO || null)
      .input("SUPPLIER_DELIVERY_NOTE_DATE", sql.DateTime, dateOrNull(raw.SUPPLIER_DELIVERY_NOTE_DATE))
      .input("CURRENCY_ID", sql.Int, numOrNull(raw.CURRENCY_ID))
      .input("EXCHANGE_RATE", sql.Decimal(15, 6), numOrNull(raw.EXCHANGE_RATE))
      .input("TOTAL_QUANTITY", sql.Decimal(15, 3), numOrNull(raw.TOTAL_QUANTITY))
      .input("TOTAL_VALUE_FC", sql.Decimal(15, 3), numOrNull(raw.TOTAL_VALUE_FC))
      .input("TOTAL_VALUE_LC", sql.Decimal(15, 3), numOrNull(raw.TOTAL_VALUE_LC))
      .input("STATUS_ID", sql.Int, numOrNull(raw.STATUS_ID))
      .input("RESPONSE_BY_EMP_ID", sql.Int, numOrNull(raw.RESPONSE_BY_EMP_ID))
      .input("RESPONSE_DATE", sql.DateTime, dateOrNull(raw.RESPONSE_DATE))
      .input("RESPONSE_REMARKS", sql.VarChar(500), raw.RESPONSE_REMARKS || null)
      .input("REMARKS", sql.VarChar(500), raw.REMARKS || null)
      .input("LINK_PAGES_ID", sql.Int, numOrNull(raw.LINK_PAGES_ID))
      .input("STATUS_ENTRY", sql.VarChar(20), raw.STATUS_ENTRY || null)
      .input("USER", sql.VarChar(50), raw.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), raw.MAC_ADDRESS || "WEB")
      .execute("VInventory.UPDATE_PURCHASE_GRN_HDR");

    const hdrResponse = pickResultRow(hdrResult);
    const { message } = parseSprocResult(hdrResponse, "Failed to update purchase GRN header");

    /* Delete removed lines first: an added line can reuse the LINE_NO of a line
       queued for deletion, and the SAVE proc rejects a duplicate LINE_NO. */
    const deletedIds = Array.isArray(raw.deletedIds) ? raw.deletedIds : [];
    for (const id of deletedIds) {
      await deletePurchaseGrnDtlService(id, raw.USER || "Admin", raw.ROLE || "Admin", raw.MAC_ADDRESS || "WEB");
    }

    for (const dtl of dtls) {
      if (numOrNull(dtl.PURCHASE_GRN_DTL_ID)) {
        await updatePurchaseGrnDtlService(refNo, dtl, raw);
      } else {
        await savePurchaseGrnDtlService(refNo, dtl, raw);
      }
    }

    return { message: message || "Purchase GRN updated successfully", PURCHASE_GRN_REF_NO: refNo };
  } catch (error) {
    console.error("UPDATE_PURCHASE_GRN_HDR/DTL combined error:", error);
    throw error;
  }
};

/* ----------------------------------------------------- header delete */
export const deletePurchaseGrnHdrService = async (
  refNo: string,
  user: string,
  role: string,
  macAddress: string
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    /* The DELETE proc removes only the header row, so the child lines have to
       go first - otherwise the FK would fail the moment any detail exists. */
    const children = await pool
      .request()
      .input("PURCHASE_GRN_REF_NO", sql.VarChar(50), refNo)
      .query(
        `SELECT PURCHASE_GRN_DTL_ID FROM [VInventory].[TBL_PURCHASE_GRN_DTL]
         WHERE PURCHASE_GRN_REF_NO = @PURCHASE_GRN_REF_NO`
      );

    for (const row of children.recordset || []) {
      await deletePurchaseGrnDtlService(Number(row.PURCHASE_GRN_DTL_ID), user, role, macAddress);
    }

    const result = await pool
      .request()
      .input("PURCHASE_GRN_REF_NO", sql.VarChar(50), refNo)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VInventory.DELETE_PURCHASE_GRN_HDR");

    const msg = parseSprocResult(pickResultRow(result), "Failed to delete purchase GRN");

    /* guard against a partial cascade: the header must actually be gone */
    const remaining = await pool
      .request()
      .input("PURCHASE_GRN_REF_NO", sql.VarChar(50), refNo)
      .query(
        `SELECT COUNT(*) AS HDR_COUNT FROM [VInventory].[TBL_PURCHASE_GRN_HDR] WHERE PURCHASE_GRN_REF_NO = @PURCHASE_GRN_REF_NO`
      );
    if (Number(remaining.recordset?.[0]?.HDR_COUNT || 0) > 0) {
      const error = new Error(
        `Purchase GRN ${refNo} could not be deleted. The header is still present.`
      ) as Error & { httpStatus?: number };
      error.httpStatus = 400;
      throw error;
    }

    return { message: msg.message || "Purchase GRN deleted successfully" };
  } catch (error) {
    console.error("DELETE_PURCHASE_GRN_HDR SP error:", error);
    throw error;
  }
};
