import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult, pickResultRow } from "../utils/sprocResult";

export interface OpeningStockDtl {
  OPENING_STOCK_DTL_ID?: number;
  LINE_NO?: number;
  MAIN_CATEGORY_ID?: number;
  SUB_CATEGORY_ID?: number;
  PRODUCT_ID?: number;
  NO_OF_PCS_PER_PACKING?: any;
  TOTAL_QUANTITY?: any;
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
  REMARKS?: string;
  STATUS_ENTRY?: string;
}

export interface OpeningStockData {
  SNO?: number;
  OPENING_STOCK_REF_NO?: string;
  OPENING_STOCK_DATE?: string;
  COMPANY_ID?: number;
  CAMP_ID?: number;
  STORE_ID?: number;
  LOCATION_ID?: number;
  CURRENCY_ID?: number;
  EXCHANGE_RATE?: any;
  TOTAL_QUANTITY?: any;
  TOTAL_VALUE_FC?: any;
  TOTAL_VALUE_LC?: any;
  STATUS_ID?: number;
  REMARKS?: string;
  LINK_PAGES_ID?: number;
  STATUS_ENTRY?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
  dtls?: OpeningStockDtl[];
  deletedIds?: number[];
}

export interface OpeningStockListFilter {
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
/* The SAVE/UPDATE procs store whatever amount columns they are given -  */
/* they never calculate. Every line amount is derived here per the DDL:  */
/*                                                                       */
/*   TOTAL_COST_FC = TOTAL_QUANTITY x RATE_FC                            */
/*   RATE_LC       = RATE_FC x EXCHANGE_RATE                             */
/*   TOTAL_COST_LC = TOTAL_COST_FC x EXCHANGE_RATE                       */
/* ------------------------------------------------------------------ */
const computeDtlAmounts = (dtl: OpeningStockDtl, headerRate: any): OpeningStockDtl => {
  const qty = toNum(dtl.TOTAL_QUANTITY);
  const rate = toNum(dtl.RATE_FC);
  const exRate = toNum(dtl.EXCHANGE_RATE ?? headerRate);

  const totalCostFc = r3(qty * rate);
  const rateLc = r3(rate * exRate);
  const totalCostLc = r3(totalCostFc * exRate);

  return {
    ...dtl,
    EXCHANGE_RATE: dtl.EXCHANGE_RATE ?? headerRate,
    TOTAL_COST_FC: totalCostFc,
    RATE_LC: rateLc,
    TOTAL_COST_LC: totalCostLc,
  };
};

/* Header roll-up: the header SAVE/UPDATE also store the totals as given, so
   the sums are recomputed from the saved lines here and passed along. */
const computeHeaderTotals = (data: OpeningStockData, lines: OpeningStockDtl[]) => ({
  ...data,
  TOTAL_QUANTITY: r3(lines.reduce((a, l) => a + toNum(l.TOTAL_QUANTITY), 0)),
  TOTAL_VALUE_FC: r3(lines.reduce((a, l) => a + toNum(l.TOTAL_COST_FC), 0)),
  TOTAL_VALUE_LC: r3(lines.reduce((a, l) => a + toNum(l.TOTAL_COST_LC), 0)),
});

/* -------------------------------------------------------------- list */
/* No report/list proc exists, so the grid reads the header table directly
   and LEFT JOINs the masters for the display names (raw ids are all the
   SHOW proc returns). Company filtering is optional. */
export const getOpeningStockListService = async (filter: OpeningStockListFilter = {}) => {
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
           H.OPENING_STOCK_REF_NO,
           H.OPENING_STOCK_DATE,
           H.COMPANY_ID,
           C.COMPANY_NAME,
           H.CAMP_ID,
           CP.CAMP_NAME,
           H.STORE_ID,
           ST.STORE_NAME,
           H.LOCATION_ID,
           L.LOCATION_NAME,
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
         FROM [VInventory].[TBL_OPENING_STOCK_HDR] H
         LEFT JOIN [VMaster].[TBL_COMPANY_MASTER] C ON C.COMPANY_ID = H.COMPANY_ID
         LEFT JOIN [VMaster].[TBL_CAMP_MASTER] CP ON CP.CAMP_ID = H.CAMP_ID
         LEFT JOIN [VMaster].[tbl_Store_Master] ST ON ST.Store_Id = H.STORE_ID
         LEFT JOIN [VMaster].[TBL_LOCATION_MASTER] L ON L.LOCATION_ID = H.LOCATION_ID
         LEFT JOIN [VMaster].[TBL_CURRENCY_MASTER] CU ON CU.CURRENCY_ID = H.CURRENCY_ID
         LEFT JOIN [VMaster].[TBL_STATUS_MASTER] S ON S.STATUS_ID = H.STATUS_ID
         WHERE (@COMPANY_ID IS NULL OR H.COMPANY_ID = @COMPANY_ID)
         ORDER BY H.OPENING_STOCK_DATE DESC, H.OPENING_STOCK_REF_NO DESC`
      );

    return (result.recordset || []).map((r: any) => ({
      ...r,
      id: r.SNO,
      openingStockNo: r.OPENING_STOCK_REF_NO,
      openingStockDate: r.OPENING_STOCK_DATE,
      companyName: r.COMPANY_NAME,
      campName: r.CAMP_NAME,
      storeName: r.STORE_NAME,
      locationName: r.LOCATION_NAME,
      currencyName: r.CURRENCY_NAME,
      statusName: r.STATUS_NAME,
    }));
  } catch (error) {
    console.error("OPENING_STOCK list query error:", error);
    throw error;
  }
};

/* --------------------------------------------------------- single header */
export const getOpeningStockHdrService = async (refNo: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("OPENING_STOCK_REF_NO", sql.VarChar(50), refNo)
      .execute("VInventory.GET_OPENING_STOCK_HDR");

    const row = result.recordset?.[0] || null;
    if (!row) throw new Error("Opening Stock header not found");
    return row;
  } catch (error) {
    console.error("GET_OPENING_STOCK_HDR SP error:", error);
    throw error;
  }
};

/* -------------------------------------------------------------- details */
export const getOpeningStockDtlsService = async (refNo: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("OPENING_STOCK_REF_NO", sql.VarChar(50), refNo)
      .execute("VInventory.SHOW_OPENING_STOCK_DTL");

    /* SHOW_OPENING_STOCK_DTL has no ORDER BY, so the lines are put into the
       order the rest of the UI expects here. */
    return (result.recordset || []).sort(
      (a: any, b: any) => toNum(a.LINE_NO) - toNum(b.LINE_NO)
    );
  } catch (error) {
    console.error("SHOW_OPENING_STOCK_DTL SP error:", error);
    throw error;
  }
};

export const getOpeningStockDtlService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("OPENING_STOCK_DTL_ID", sql.Int, id)
      .execute("VInventory.GET_OPENING_STOCK_DTL");

    const row = result.recordset?.[0] || null;
    if (!row) throw new Error("Opening Stock detail not found");
    return row;
  } catch (error) {
    console.error("GET_OPENING_STOCK_DTL SP error:", error);
    throw error;
  }
};

/* ------------------------------------------------------------- dtl save */
const saveOpeningStockDtlService = async (
  refNo: string,
  dtl: OpeningStockDtl,
  data: OpeningStockData
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const c = computeDtlAmounts(dtl, data.EXCHANGE_RATE);

  const result = await pool
    .request()
    .input("OPENING_STOCK_REF_NO", sql.VarChar(50), refNo)
    .input("LINE_NO", sql.Int, numOrNull(c.LINE_NO) ?? 0)
    .input("MAIN_CATEGORY_ID", sql.Int, numOrNull(c.MAIN_CATEGORY_ID))
    .input("SUB_CATEGORY_ID", sql.Int, numOrNull(c.SUB_CATEGORY_ID))
    .input("PRODUCT_ID", sql.Int, numOrNull(c.PRODUCT_ID))
    .input("NO_OF_PCS_PER_PACKING", sql.Decimal(15, 3), numOrNull(c.NO_OF_PCS_PER_PACKING))
    .input("TOTAL_QUANTITY", sql.Decimal(15, 3), numOrNull(c.TOTAL_QUANTITY))
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
    .input("REMARKS", sql.VarChar(500), c.REMARKS || null)
    .input("STATUS_ENTRY", sql.VarChar(20), c.STATUS_ENTRY || "CF")
    .input("USER", sql.VarChar(50), data.USER || "Admin")
    .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
    .execute("VInventory.SAVE_OPENING_STOCK_DTL");

  const row = pickResultRow(result);
  parseSprocResult(row, "Failed to save opening stock detail");
  return row;
};

/* ------------------------------------------------------------ dtl update */
const updateOpeningStockDtlService = async (
  refNo: string,
  dtl: OpeningStockDtl,
  data: OpeningStockData
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const c = computeDtlAmounts(dtl, data.EXCHANGE_RATE);

  const result = await pool
    .request()
    .input("OPENING_STOCK_DTL_ID", sql.Int, numOrNull(c.OPENING_STOCK_DTL_ID) ?? 0)
    .input("OPENING_STOCK_REF_NO", sql.VarChar(50), refNo)
    .input("LINE_NO", sql.Int, numOrNull(c.LINE_NO) ?? 0)
    .input("MAIN_CATEGORY_ID", sql.Int, numOrNull(c.MAIN_CATEGORY_ID))
    .input("SUB_CATEGORY_ID", sql.Int, numOrNull(c.SUB_CATEGORY_ID))
    .input("PRODUCT_ID", sql.Int, numOrNull(c.PRODUCT_ID))
    .input("NO_OF_PCS_PER_PACKING", sql.Decimal(15, 3), numOrNull(c.NO_OF_PCS_PER_PACKING))
    .input("TOTAL_QUANTITY", sql.Decimal(15, 3), numOrNull(c.TOTAL_QUANTITY))
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
    .input("REMARKS", sql.VarChar(500), c.REMARKS || null)
    .input("STATUS_ENTRY", sql.VarChar(20), c.STATUS_ENTRY || null)
    .input("USER", sql.VarChar(50), data.USER || "Admin")
    .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
    .execute("VInventory.UPDATE_OPENING_STOCK_DTL");

  const row = pickResultRow(result);
  parseSprocResult(row, "Failed to update opening stock detail");
  return row;
};

/* -------------------------------------------------------- dtl deletion */
export const deleteOpeningStockDtlService = async (
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
      .input("OPENING_STOCK_DTL_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VInventory.DELETE_OPENING_STOCK_DTL");

    const { message } = parseSprocResult(pickResultRow(result), "Failed to delete opening stock detail");
    return { message: message || "Opening Stock detail deleted successfully" };
  } catch (error) {
    console.error("DELETE_OPENING_STOCK_DTL SP error:", error);
    throw error;
  }
};

/* ----------------------------------------------------- combined save */
export const saveOpeningStockCombinedService = async (data: OpeningStockData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const computedDtls = (Array.isArray(data.dtls) ? data.dtls : []).map((d) =>
      computeDtlAmounts(d, data.EXCHANGE_RATE)
    );
    const header = computeHeaderTotals(data, computedDtls);

    const hdrResult = await pool
      .request()
      .input("OPENING_STOCK_REF_NO", sql.VarChar(50), "")
      .input("OPENING_STOCK_DATE", sql.DateTime, dateOrNull(header.OPENING_STOCK_DATE))
      .input("COMPANY_ID", sql.Int, numOrNull(header.COMPANY_ID))
      .input("CAMP_ID", sql.Int, numOrNull(header.CAMP_ID))
      .input("STORE_ID", sql.Int, numOrNull(header.STORE_ID))
      .input("LOCATION_ID", sql.Int, numOrNull(header.LOCATION_ID))
      .input("CURRENCY_ID", sql.Int, numOrNull(header.CURRENCY_ID))
      .input("EXCHANGE_RATE", sql.Decimal(15, 6), numOrNull(header.EXCHANGE_RATE))
      .input("TOTAL_QUANTITY", sql.Decimal(15, 3), numOrNull(header.TOTAL_QUANTITY))
      .input("TOTAL_VALUE_FC", sql.Decimal(15, 3), numOrNull(header.TOTAL_VALUE_FC))
      .input("TOTAL_VALUE_LC", sql.Decimal(15, 3), numOrNull(header.TOTAL_VALUE_LC))
      .input("STATUS_ID", sql.Int, numOrNull(header.STATUS_ID))
      .input("REMARKS", sql.VarChar(500), header.REMARKS || null)
      .input("LINK_PAGES_ID", sql.Int, numOrNull(header.LINK_PAGES_ID))
      .input("STATUS_ENTRY", sql.VarChar(20), header.STATUS_ENTRY || "CF")
      .input("USER", sql.VarChar(50), header.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), header.MAC_ADDRESS || "WEB")
      .execute("VInventory.SAVE_OPENING_STOCK_HDR");

    const hdrResponse = pickResultRow(hdrResult);
    const { message, data: parsedData } = parseSprocResult(
      hdrResponse,
      "Failed to save opening stock header"
    );
    const refNo = String(parsedData ?? header.OPENING_STOCK_REF_NO ?? "").trim();

    if (!refNo) {
      throw new Error("Can't Generate Open Stock Ref Number. Contact Admin");
    }

    for (const dtl of computedDtls) {
      await saveOpeningStockDtlService(refNo, dtl, data);
    }

    return { message: message || "Opening Stock created successfully", OPENING_STOCK_REF_NO: refNo };
  } catch (error) {
    console.error("SAVE_OPENING_STOCK_HDR/DTL combined error:", error);
    throw error;
  }
};

/* --------------------------------------------------- combined update */
export const updateOpeningStockCombinedService = async (data: OpeningStockData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const refNo = String(data.OPENING_STOCK_REF_NO || "").trim();
  if (!refNo) throw new Error("Opening Stock Reference No is required");

  try {
    const computedDtls = (Array.isArray(data.dtls) ? data.dtls : []).map((d) =>
      computeDtlAmounts(d, data.EXCHANGE_RATE)
    );
    const header = computeHeaderTotals(data, computedDtls);

    const hdrResult = await pool
      .request()
      .input("SNO", sql.Int, numOrNull(header.SNO) ?? 0)
      .input("OPENING_STOCK_REF_NO", sql.VarChar(50), refNo)
      .input("OPENING_STOCK_DATE", sql.DateTime, dateOrNull(header.OPENING_STOCK_DATE))
      .input("COMPANY_ID", sql.Int, numOrNull(header.COMPANY_ID))
      .input("CAMP_ID", sql.Int, numOrNull(header.CAMP_ID))
      .input("STORE_ID", sql.Int, numOrNull(header.STORE_ID))
      .input("LOCATION_ID", sql.Int, numOrNull(header.LOCATION_ID))
      .input("CURRENCY_ID", sql.Int, numOrNull(header.CURRENCY_ID))
      .input("EXCHANGE_RATE", sql.Decimal(15, 6), numOrNull(header.EXCHANGE_RATE))
      .input("TOTAL_QUANTITY", sql.Decimal(15, 3), numOrNull(header.TOTAL_QUANTITY))
      .input("TOTAL_VALUE_FC", sql.Decimal(15, 3), numOrNull(header.TOTAL_VALUE_FC))
      .input("TOTAL_VALUE_LC", sql.Decimal(15, 3), numOrNull(header.TOTAL_VALUE_LC))
      .input("STATUS_ID", sql.Int, numOrNull(header.STATUS_ID))
      .input("REMARKS", sql.VarChar(500), header.REMARKS || null)
      .input("LINK_PAGES_ID", sql.Int, numOrNull(header.LINK_PAGES_ID))
      .input("STATUS_ENTRY", sql.VarChar(20), header.STATUS_ENTRY || null)
      .input("USER", sql.VarChar(50), header.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), header.MAC_ADDRESS || "WEB")
      .execute("VInventory.UPDATE_OPENING_STOCK_HDR");

    const hdrResponse = pickResultRow(hdrResult);
    const { message, data: parsedData } = parseSprocResult(
      hdrResponse,
      "Failed to update opening stock header"
    );
    void parsedData;

    for (const dtl of computedDtls) {
      if (numOrNull(dtl.OPENING_STOCK_DTL_ID)) {
        await updateOpeningStockDtlService(refNo, dtl, data);
      } else {
        await saveOpeningStockDtlService(refNo, dtl, data);
      }
    }

    const deletedIds = Array.isArray(data.deletedIds) ? data.deletedIds : [];
    for (const id of deletedIds) {
      await deleteOpeningStockDtlService(id, data.USER || "Admin", data.ROLE || "Admin", data.MAC_ADDRESS || "WEB");
    }

    return { message: message || "Opening Stock updated successfully", OPENING_STOCK_REF_NO: refNo };
  } catch (error) {
    console.error("UPDATE_OPENING_STOCK_HDR/DTL combined error:", error);
    throw error;
  }
};

/* ----------------------------------------------------- header delete */
export const deleteOpeningStockHdrService = async (
  refNo: string,
  user: string,
  role: string,
  macAddress: string
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    /* The DELETE proc removes only the header row, so the child lines have to
       go first - otherwise the delete fails the moment any detail exists. */
    const children = await pool
      .request()
      .input("OPENING_STOCK_REF_NO", sql.VarChar(50), refNo)
      .query(
        `SELECT OPENING_STOCK_DTL_ID FROM [VInventory].[TBL_OPENING_STOCK_DTL]
         WHERE OPENING_STOCK_REF_NO = @OPENING_STOCK_REF_NO`
      );

    for (const row of children.recordset || []) {
      await deleteOpeningStockDtlService(Number(row.OPENING_STOCK_DTL_ID), user, role, macAddress);
    }

    const result = await pool
      .request()
      .input("OPENING_STOCK_REF_NO", sql.VarChar(50), refNo)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VInventory.DELETE_OPENING_STOCK_HDR");

    const msg = parseSprocResult(pickResultRow(result), "Failed to delete opening stock");
    return { message: msg.message || "Data Deleted Successfully" };
  } catch (error) {
    console.error("DELETE_OPENING_STOCK_HDR SP error:", error);
    throw error;
  }
};