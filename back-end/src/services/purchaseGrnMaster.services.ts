import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult, pickResultRow } from "../utils/sprocResult";

export interface PurchaseGrnDtl {
  key?: string;
  PURCHASE_GRN_DTL_ID?: number;
  PURCHASE_GRN_REF_NO?: string;
  PURCHASE_ORDER_NO?: string;
  PURCHASE_ORDER_DTL_ID?: number;
  PURCHASE_INVOICE_DTL_ID?: number;
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
  LINK_ID?: number | null;
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
  PURCHASE_INVOICE_REF_NO?: string;
  CONTAINER_NO?: string;
  VEHICLE_SOURCE_STATUS?: string;
  VEHICLE_ID?: number | null;
  VEHICLE_NAME?: string;
  DRIVER_NAME?: string;
  DRIVER_PHONE_NUMBER?: string;
  SEAL_NUMBER?: string;
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
  LINK_ID?: number | null;
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
export const getPurchaseGrnHdrService = async (refNo: string, linkPagesId?: number | null) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    /* GET_PURCHASE_GRN_HDR filters on PURCHASE_GRN_REF_NO + LINK_PAGES_ID, so the
       page link id has to be supplied by the caller. */
    const result = await pool
      .request()
      .input("PURCHASE_GRN_REF_NO", sql.VarChar(50), refNo)
      .input("LINK_PAGES_ID", sql.Int, numOrNull(linkPagesId))
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
/* The GRN line procs read PO_QUANTITY and LINK_ID. Both are created by
   src/SPs/purchase_grn_migration.sql, so a database where the migration has
   not been run fails with a raw "Invalid column name", which does not say
   what to do about it. Say it in plain words instead. */
const explainGrnSchemaError = (error: any): any => {
  const message = String(error?.message || "");
  if (/Invalid column name '(PO_QUANTITY|PO_INVOICE_QUANTITY|LINK_ID)'/i.test(message)) {
    const friendly = new Error(
      "The Purchase GRN database is not up to date. Run back-end/src/SPs/purchase_grn_migration.sql (it renames PO_INVOICE_QUANTITY to PO_QUANTITY and adds LINK_ID) and deploy the procedures again."
    ) as Error & { httpStatus?: number };
    friendly.httpStatus = 500;
    return friendly;
  }
  return error;
};

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
    throw explainGrnSchemaError(error);
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
    throw explainGrnSchemaError(error);
  }
};

/* A request for one write: inside the caller's transaction when one is given,
   straight from the pool otherwise. Every write of a combined save / update
   runs inside one transaction, so a failure halfway cannot leave a GRN with
   its header updated and its lines half written. */
const newRequest = (pool: any, tx?: sql.Transaction) =>
  tx ? new sql.Request(tx) : pool.request();

/* Shared DTL input chain - the parameter names must match the deployed
   SAVE/UPDATE_PURCHASE_GRN_DTL signatures exactly (node-mssql binds the
   inputs by name, so a name that the proc does not declare fails the call).
   UPDATE primes @PURCHASE_GRN_DTL_ID first. */
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
    .input("PURCHASE_INVOICE_DTL_ID", sql.Int, numOrNull(c.PURCHASE_INVOICE_DTL_ID))
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
  data: PurchaseGrnData,
  tx?: sql.Transaction
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await grnDtlRequest(
      newRequest(pool, tx),
      refNo,
      { ...dtl, STATUS_ENTRY: dtl.STATUS_ENTRY || "AC" },
      data
    ).execute("VInventory.SAVE_PURCHASE_GRN_DTL");

    const row = pickResultRow(result);
    parseSprocResult(row, "Failed to save purchase GRN detail");
    return row;
  } catch (error) {
    console.error("SAVE_PURCHASE_GRN_DTL SP error:", error);
    throw explainGrnSchemaError(error);
  }
};

/* ------------------------------------------------------------ dtl update */
const updatePurchaseGrnDtlService = async (
  refNo: string,
  dtl: PurchaseGrnDtl,
  data: PurchaseGrnData,
  tx?: sql.Transaction
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const base = newRequest(pool, tx).input(
      "PURCHASE_GRN_DTL_ID",
      sql.Int,
      numOrNull(dtl.PURCHASE_GRN_DTL_ID) ?? 0
    );

    /* UPDATE_PURCHASE_GRN_DTL declares @LINK_ID as its final parameter, while
       SAVE_PURCHASE_GRN_DTL does not take it at all. Add it here (after the
       shared chain) so SAVE never sends an extra argument. */
    const req = grnDtlRequest(base, refNo, dtl, data);
    req.input("LINK_ID", sql.Int, numOrNull(dtl.LINK_ID ?? data.LINK_PAGES_ID));

    const result = await req.execute("VInventory.UPDATE_PURCHASE_GRN_DTL");

    const row = pickResultRow(result);
    parseSprocResult(row, "Failed to update purchase GRN detail");
    return row;
  } catch (error) {
    console.error("UPDATE_PURCHASE_GRN_DTL SP error:", error);
    throw explainGrnSchemaError(error);
  }
};

/* -------------------------------------------------------- dtl deletion */
/* Deleting a GRN line is an Admin only action - the delete proc enforces the
   same rule. The role is never defaulted: an empty role is not an Admin. */
export const deletePurchaseGrnDtlService = async (
  id: number,
  user: string,
  role: string,
  macAddress: string,
  tx?: sql.Transaction
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await newRequest(pool, tx)
      .input("PURCHASE_GRN_DTL_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "")
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
   @SNO first). The parameter widths match the header columns, so a value can
   never be longer than the column it goes into. */
const grnHdrRequest = (
  pool: any,
  data: PurchaseGrnData,
  refNo: string | null,
  tx?: sql.Transaction
) => {
  const derived = computeHeaderTotals(
    data,
    (data.dtls || []).map((d) => computeDtlAmounts(d, data.EXCHANGE_RATE))
  );

  return newRequest(pool, tx)
    .input("DRAFT_REF_NO", sql.VarChar(50), (data as any).DRAFT_REF_NO || null)
    .input("PURCHASE_GRN_REF_NO", sql.VarChar(50), refNo)
    .input("PURCHASE_GRN_DATE", sql.DateTime, dateOrNull(derived.PURCHASE_GRN_DATE))
    .input("COMPANY_ID", sql.Int, numOrNull(derived.COMPANY_ID))
    .input("CAMP_ID", sql.Int, numOrNull(derived.CAMP_ID))
    .input("STORE_ID", sql.Int, numOrNull(derived.STORE_ID))
    .input("LOCATION_ID", sql.Int, numOrNull(derived.LOCATION_ID))
    .input("SUPPLIER_BP_ID", sql.Int, numOrNull(derived.SUPPLIER_BP_ID))
    .input("PURCHASE_INVOICE_REF_NO", sql.VarChar(50), derived.PURCHASE_INVOICE_REF_NO || null)
    .input("PURCHASE_ORDER_NO", sql.VarChar(50), derived.PURCHASE_ORDER_NO || null)
    .input("SUPPLIER_INVOICE_NUMBER", sql.VarChar(100), (derived as any).SUPPLIER_INVOICE_NUMBER || null)
    .input("CONTAINER_NO", sql.VarChar(50), derived.CONTAINER_NO || null)
    .input("VEHICLE_SOURCE_STATUS", sql.VarChar(50), derived.VEHICLE_SOURCE_STATUS || null)
    .input("VEHICLE_ID", sql.Int, numOrNull(derived.VEHICLE_ID))
    .input("VEHICLE_NAME", sql.VarChar(100), derived.VEHICLE_NAME || null)
    .input("DRIVER_NAME", sql.VarChar(100), derived.DRIVER_NAME || null)
    .input("DRIVER_PHONE_NUMBER", sql.VarChar(50), derived.DRIVER_PHONE_NUMBER || null)
    .input("SEAL_NUMBER", sql.VarChar(50), derived.SEAL_NUMBER || null)
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

/* A column can be missing while the database has not been migrated yet - the
   migration (src/SPs/purchase_grn_migration.sql) renames PO_INVOICE_QUANTITY
   to PO_QUANTITY and adds LINK_ID to the GRN lines. Writing to a column that
   is not there fails the whole save with "Invalid column name", so the column
   is looked up first and the write is skipped when it is missing. The answer
   is cached for a minute, so the check costs one query per table and minute. */
const columnExistsCache = new Map<string, { at: number; found: boolean }>();
const COLUMN_CACHE_MS = 60_000;

const columnExists = async (
  pool: any,
  schema: string,
  table: string,
  column: string
): Promise<boolean> => {
  const key = `${schema}.${table}.${column}`;
  const cached = columnExistsCache.get(key);
  const now = Date.now();
  if (cached && now - cached.at < COLUMN_CACHE_MS) return cached.found;

  const r = await pool
    .request()
    .input("SCHEMA_NAME", sql.VarChar(50), schema)
    .input("TABLE_NAME", sql.VarChar(100), table)
    .input("COLUMN_NAME", sql.VarChar(100), column)
    .query(
      `SELECT 1 AS HIT
         FROM sys.columns c
         JOIN sys.objects o ON o.object_id = c.object_id
         JOIN sys.schemas s ON s.schema_id = o.schema_id
        WHERE s.name = @SCHEMA_NAME
          AND o.name = @TABLE_NAME
          AND c.name = @COLUMN_NAME`
    );

  const found = Number(r.recordset?.[0]?.HIT || 0) > 0;
  columnExistsCache.set(key, { at: now, found });
  return found;
};

const warnedColumns = new Set<string>();
const warnMissingColumn = (key: string, message: string) => {
  if (warnedColumns.has(key)) return;
  warnedColumns.add(key);
  console.warn(`[purchase GRN] ${message}`);
};

/* The HDR procs take @LINK_PAGES_ID but not the dedicated LINK_ID column, so
   mirror the page link id into LINK_ID after the write. */
const syncGrnHdrLinkId = async (pool: any, refNo: string, linkId: any, tx?: sql.Transaction) => {
  const value = numOrNull(linkId);
  if (!refNo || value === null) return;
  if (!(await columnExists(pool, "VInventory", "TBL_PURCHASE_GRN_HDR", "LINK_ID"))) {
    warnMissingColumn(
      "hdr_link_id",
      "TBL_PURCHASE_GRN_HDR.LINK_ID is missing - run back-end/src/SPs/purchase_grn_migration.sql"
    );
    return;
  }
  await newRequest(pool, tx)
    .input("REF_NO", sql.VarChar(50), refNo)
    .input("LINK_ID", sql.Int, value)
    .query(
      "UPDATE [VInventory].[TBL_PURCHASE_GRN_HDR] SET LINK_ID = @LINK_ID WHERE PURCHASE_GRN_REF_NO = @REF_NO"
    );
};

/* SAVE_PURCHASE_GRN_DTL has no @LINK_ID parameter (the update proc does), so
   the lines created on a new GRN are stamped the same way as the header. */
const syncGrnDtlLinkId = async (pool: any, refNo: string, linkId: any, tx?: sql.Transaction) => {
  const value = numOrNull(linkId);
  if (!refNo || value === null) return;
  if (!(await columnExists(pool, "VInventory", "TBL_PURCHASE_GRN_DTL", "LINK_ID"))) {
    warnMissingColumn(
      "dtl_link_id",
      "TBL_PURCHASE_GRN_DTL.LINK_ID is missing - run back-end/src/SPs/purchase_grn_migration.sql"
    );
    return;
  }
  await newRequest(pool, tx)
    .input("REF_NO", sql.VarChar(50), refNo)
    .input("LINK_ID", sql.Int, value)
    .query(
      "UPDATE [VInventory].[TBL_PURCHASE_GRN_DTL] SET LINK_ID = @LINK_ID WHERE PURCHASE_GRN_REF_NO = @REF_NO"
    );
};

/* UPDATE_PURCHASE_GRN_HDR has no parameters for the newer transport / invoice
   columns (the SAVE proc does), so they are written directly after the update
   so editing a GRN does not silently drop them. */
const syncGrnHdrTransportFields = async (
  pool: any,
  refNo: string,
  data: PurchaseGrnData,
  tx?: sql.Transaction
) => {
  if (!refNo) return;
  await newRequest(pool, tx)
    .input("REF_NO", sql.VarChar(50), refNo)
    .input("PURCHASE_INVOICE_REF_NO", sql.VarChar(50), data.PURCHASE_INVOICE_REF_NO || null)
    .input("CONTAINER_NO", sql.VarChar(50), data.CONTAINER_NO || null)
    .input("VEHICLE_SOURCE_STATUS", sql.VarChar(50), data.VEHICLE_SOURCE_STATUS || null)
    .input("VEHICLE_ID", sql.Int, numOrNull(data.VEHICLE_ID))
    .input("VEHICLE_NAME", sql.VarChar(100), data.VEHICLE_NAME || null)
    .input("DRIVER_NAME", sql.VarChar(100), data.DRIVER_NAME || null)
    .input("DRIVER_PHONE_NUMBER", sql.VarChar(50), data.DRIVER_PHONE_NUMBER || null)
    .input("SEAL_NUMBER", sql.VarChar(50), data.SEAL_NUMBER || null)
    .query(
      `UPDATE [VInventory].[TBL_PURCHASE_GRN_HDR]
         SET PURCHASE_INVOICE_REF_NO = @PURCHASE_INVOICE_REF_NO,
             CONTAINER_NO = @CONTAINER_NO,
             VEHICLE_SOURCE_STATUS = @VEHICLE_SOURCE_STATUS,
             VEHICLE_ID = @VEHICLE_ID,
             VEHICLE_NAME = @VEHICLE_NAME,
             DRIVER_NAME = @DRIVER_NAME,
             DRIVER_PHONE_NUMBER = @DRIVER_PHONE_NUMBER,
             SEAL_NUMBER = @SEAL_NUMBER
       WHERE PURCHASE_GRN_REF_NO = @REF_NO`
    );
};

/* ----------------------------------------------------- combined save */
export const savePurchaseGrnCombinedService = async (raw: PurchaseGrnData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const tx = new sql.Transaction(pool);

  try {
    await tx.begin();

    const dtls = (Array.isArray(raw.dtls) ? raw.dtls : []).map((d) =>
      computeDtlAmounts(d, raw.EXCHANGE_RATE)
    );

    const hdrResult = await grnHdrRequest(
      pool,
      { ...raw, dtls, STATUS_ENTRY: raw.STATUS_ENTRY || "CF" },
      "",
      tx
    ).execute("VInventory.SAVE_PURCHASE_GRN_HDR");

    const { message, data: parsedData } = parseSprocResult(
      pickResultRow(hdrResult),
      "Failed to save purchase GRN header"
    );
    const refNo = String(parsedData ?? raw.PURCHASE_GRN_REF_NO ?? "").trim();

    if (!refNo) {
      throw new Error("Can't Generate Purchase GRN Reference Number. Contact Admin");
    }

    await syncGrnHdrLinkId(pool, refNo, raw.LINK_ID ?? raw.LINK_PAGES_ID, tx);

    for (const dtl of dtls) {
      await savePurchaseGrnDtlService(refNo, dtl, raw, tx);
    }

    await syncGrnDtlLinkId(pool, refNo, raw.LINK_ID ?? raw.LINK_PAGES_ID, tx);

    await tx.commit();

    return { message: message || "Purchase GRN created successfully", PURCHASE_GRN_REF_NO: refNo };
  } catch (error) {
    await tx.rollback().catch(() => undefined);
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

  const dtls = (Array.isArray(raw.dtls) ? raw.dtls : []).map((d) =>
    computeDtlAmounts(d, raw.EXCHANGE_RATE)
  );
  const deletedIds = (Array.isArray(raw.deletedIds) ? raw.deletedIds : [])
    .map((id) => numOrNull(id))
    .filter((id): id is number => id !== null);

  /* Removing a line is an Admin only action - the delete proc enforces the
     same rule. It is checked before anything is written, so a user without
     the right can never end up with a half updated GRN. */
  if (deletedIds.length > 0 && String(raw.ROLE || "").trim() !== "Admin") {
    const error = new Error(
      "Only an Admin can remove a Purchase GRN line. The record was not changed."
    ) as Error & { httpStatus?: number };
    error.httpStatus = 403;
    throw error;
  }

  const tx = new sql.Transaction(pool);

  try {
    await tx.begin();

    /* The header totals are rolled up from the lines that are being saved.
       The update path used to take them from the request, and the request
       never carried them, so every edit blanked the totals on the GRN list. */
    const derived = computeHeaderTotals(raw, dtls);

    /* Removed lines go first: an added line re-uses the line number of the
       line that was removed, and the line numbers have to be unique within
       the GRN. */
    for (const id of deletedIds) {
      await deletePurchaseGrnDtlService(
        id,
        raw.USER || "Admin",
        raw.ROLE || "",
        raw.MAC_ADDRESS || "WEB",
        tx
      );
    }

    for (const dtl of dtls) {
      if (numOrNull(dtl.PURCHASE_GRN_DTL_ID)) {
        await updatePurchaseGrnDtlService(refNo, dtl, raw, tx);
      } else {
        await savePurchaseGrnDtlService(refNo, dtl, raw, tx);
      }
    }

    const hdrResult = await newRequest(pool, tx)
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
      .input("TOTAL_QUANTITY", sql.Decimal(15, 3), numOrNull(derived.TOTAL_QUANTITY))
      .input("TOTAL_VALUE_FC", sql.Decimal(15, 3), numOrNull(derived.TOTAL_VALUE_FC))
      .input("TOTAL_VALUE_LC", sql.Decimal(15, 3), numOrNull(derived.TOTAL_VALUE_LC))
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

    await syncGrnHdrLinkId(pool, refNo, raw.LINK_ID ?? raw.LINK_PAGES_ID, tx);
    await syncGrnHdrTransportFields(pool, refNo, raw, tx);

    await tx.commit();

    return { message: message || "Purchase GRN updated successfully", PURCHASE_GRN_REF_NO: refNo };
  } catch (error) {
    await tx.rollback().catch(() => undefined);
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

  /* Deleting a GRN is an Admin only action - the delete procs enforce the same
     rule. It is checked up front, because the child lines are removed before
     the header and a refusal half way through would leave a header without
     its lines. */
  if (String(role || "").trim() !== "Admin") {
    const error = new Error(
      "Only an Admin can delete a Purchase GRN. The record was not changed."
    ) as Error & { httpStatus?: number };
    error.httpStatus = 403;
    throw error;
  }

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
      .input("ROLE", sql.VarChar(50), role || "")
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

    /* The batches mapped to the GRN go with it. A GRN reference number is
       generated from MAX(...) + 1, so a deleted reference number is re-used
       and the orphaned batches of the old GRN would re-attach to the new one.
       (The delete proc removes them as well - this is the safety net for a
       database where that proc has not been redeployed yet.) */
    await pool
      .request()
      .input("BATCH_SOURCE_REF_NO", sql.VarChar(50), refNo)
      .query(
        `DELETE FROM [VInventory].[TBL_BATCH_MASTER] WHERE BATCH_SOURCE_REF_NO = @BATCH_SOURCE_REF_NO`
      );

    return { message: msg.message || "Purchase GRN deleted successfully" };
  } catch (error) {
    console.error("DELETE_PURCHASE_GRN_HDR SP error:", error);
    throw error;
  }
};
