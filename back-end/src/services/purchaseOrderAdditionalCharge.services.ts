import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface PurchaseOrderAdditionalChargeData {
  PURCHASE_ORDER_ADDITIONAL_CHARGES_ID?: number;
  PURCHASE_ORDER_NO: string;
  PURCHASE_QUOTATION_NO?: string | null;
  PURCHASE_QUOTATION_ADDITIONAL_CHARGES_ID?: number | null;
  LINE_NO?: number | null;
  ADDITIONAL_CHARGE_TYPE_ID?: number | null;
  DESCRIPTION?: string | null;
  QUANTITY?: any;
  UOM_ID?: number | null;
  RATE?: any;
  TAX_ID?: number | null;
  TAX_PERCENTAGE?: any;
  EXCHANGE_RATE?: any;
  REMARKS?: string | null;
  STATUS_ENTRY?: string;
  TOTAL_AMOUNT_FC?: any;
  TAX_AMOUNT_FC?: any;
  FINAL_AMOUNT_FC?: any;
  TOTAL_AMOUNT_LC?: any;
  TAX_AMOUNT_LC?: any;
  FINAL_AMOUNT_LC?: any;
  USER?: string;
  MAC_ADDRESS?: string;
}

/* amount / rate helper - keeps 0 as a real 0, blanks as NULL */
const amtOrNull = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

const toNum = (v: any): number => {
  const n = Number(v);
  return v === "" || v === null || v === undefined || Number.isNaN(n) ? 0 : n;
};

const numOrNull = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

const r3 = (n: number) => Math.round(n * 1000) / 1000;

/* ------------------------------------------------------------------ */
/* Like the detail-line procs, SAVE/UPDATE only persist the derived      */
/* amount columns - the SP never calculates them. Every FC/LC amount is  */
/* recomputed here from the line's own inputs, per the DDL formulas:     */
/*                                                                       */
/*   TOTAL_AMOUNT_FC = QUANTITY x RATE                                   */
/*   TAX_AMOUNT_FC   = TOTAL_AMOUNT_FC x TAX_PERCENTAGE / 100            */
/*   FINAL_AMOUNT_FC = TOTAL_AMOUNT_FC + TAX_AMOUNT_FC                   */
/*   each LC column  = the FC column x EXCHANGE_RATE                     */
/* ------------------------------------------------------------------ */
const computeChargeAmounts = (
  charge: PurchaseOrderAdditionalChargeData
): PurchaseOrderAdditionalChargeData => {
  const qty = toNum(charge.QUANTITY);
  const rate = toNum(charge.RATE);
  const taxPct = toNum(charge.TAX_PERCENTAGE);

  const exRate = amtOrNull(charge.EXCHANGE_RATE) ?? 0;

  const totalFc = r3(qty * rate);
  const taxFc = r3((totalFc * taxPct) / 100);
  const finalFc = r3(totalFc + taxFc);

  return {
    ...charge,
    TOTAL_AMOUNT_FC: totalFc,
    TAX_AMOUNT_FC: taxFc,
    FINAL_AMOUNT_FC: finalFc,
    TOTAL_AMOUNT_LC: r3(totalFc * exRate),
    TAX_AMOUNT_LC: r3(taxFc * exRate),
    FINAL_AMOUNT_LC: r3(finalFc * exRate),
  };
};

const fetchHeaderExchangeRate = async (refNo: string): Promise<number | null> => {
  const pool = getPool();
  if (!pool) return null;
  try {
    const result = await pool
      .request()
      .input("PURCHASE_ORDER_NO", sql.VarChar(50), refNo)
      .query("SELECT EXCHANGE_RATE FROM VPurchase.TBL_PURCHASE_ORDER_HDR WHERE PURCHASE_ORDER_NO = @PURCHASE_ORDER_NO");
    const rate = result.recordset?.[0]?.EXCHANGE_RATE;
    return rate === undefined || rate === null || rate === "" ? null : Number(rate);
  } catch (error) {
    console.error("fetchHeaderExchangeRate error:", error);
    return null;
  }
};

const resolveTaxPercentage = async (data: PurchaseOrderAdditionalChargeData): Promise<number> => {
  if (data.TAX_PERCENTAGE !== undefined && data.TAX_PERCENTAGE !== null && data.TAX_PERCENTAGE !== "") {
    return Number(data.TAX_PERCENTAGE);
  }
  if (data.TAX_ID) {
    const pool = getPool();
    if (pool) {
      try {
        const result = await pool
          .request()
          .input("TAX_ID", sql.Int, data.TAX_ID)
          .query("SELECT TAX_PERCENTAGE FROM VMASTER.TBL_TAX_MASTER WHERE TAX_ID = @TAX_ID");
        const pct = result.recordset?.[0]?.TAX_PERCENTAGE;
        if (pct !== undefined && pct !== null) return Number(pct);
      } catch (error) {
        console.error("resolveTaxPercentage error:", error);
      }
    }
  }
  return 0;
};

/* ------------------------------------------------------------- show */
export const getPurchaseOrderAdditionalChargesService = async (refNo: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PURCHASE_ORDER_NO", sql.VarChar(50), refNo)
      .execute("VPurchase.SHOW_PURCHASE_ORDER_ADDITIONAL_CHARGES_DTL");

    /* The proc aliases the identity column as ID; normalise it back to the
       column name the rest of the UI keys on. */
    return (result.recordset || []).map((row: any) => ({
      ...row,
      PURCHASE_ORDER_ADDITIONAL_CHARGES_ID:
        row.PURCHASE_ORDER_ADDITIONAL_CHARGES_ID ?? row.ID ?? row.Id,
    }));
  } catch (error) {
    console.error("SHOW_PURCHASE_ORDER_ADDITIONAL_CHARGES_DTL SP error:", error);
    throw error;
  }
};

/* ----------------------------------------------------------- get one */
export const getPurchaseOrderAdditionalChargeService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PURCHASE_ORDER_ADDITIONAL_CHARGES_ID", sql.Int, id)
      .execute("VPurchase.GET_PURCHASE_ORDER_ADDITIONAL_CHARGES_DTL");

    const row = result.recordset?.[0] || null;
    if (!row) throw new Error("Purchase order additional charge not found");
    return row;
  } catch (error) {
    console.error("GET_PURCHASE_ORDER_ADDITIONAL_CHARGES_DTL SP error:", error);
    throw error;
  }
};

/* -------------------------------------------------------------- save */
export const savePurchaseOrderAdditionalChargeService = async (data: PurchaseOrderAdditionalChargeData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const headerRate = await fetchHeaderExchangeRate(data.PURCHASE_ORDER_NO);
    const taxPercentage = await resolveTaxPercentage(data);
    const charge = computeChargeAmounts({ ...data, EXCHANGE_RATE: data.EXCHANGE_RATE ?? headerRate, TAX_PERCENTAGE: taxPercentage });

    const result = await pool
      .request()
      .input("PURCHASE_ORDER_NO", sql.VarChar(50), charge.PURCHASE_ORDER_NO)
      .input("PURCHASE_QUOTATION_NO", sql.VarChar(50), charge.PURCHASE_QUOTATION_NO || null)
      .input("PURCHASE_QUOTATION_ADDITIONAL_CHARGES_ID", sql.Int, numOrNull(charge.PURCHASE_QUOTATION_ADDITIONAL_CHARGES_ID))
      .input("LINE_NO", sql.Int, numOrNull(charge.LINE_NO) ?? 0)
      .input("ADDITIONAL_CHARGE_TYPE_ID", sql.Int, numOrNull(charge.ADDITIONAL_CHARGE_TYPE_ID))
      .input("DESCRIPTION", sql.VarChar(500), charge.DESCRIPTION || null)
      .input("QUANTITY", sql.Decimal(15, 3), amtOrNull(charge.QUANTITY))
      .input("UOM_ID", sql.Int, numOrNull(charge.UOM_ID))
      .input("RATE", sql.Decimal(15, 3), amtOrNull(charge.RATE))
      .input("TOTAL_AMOUNT_FC", sql.Decimal(15, 3), amtOrNull(charge.TOTAL_AMOUNT_FC))
      .input("TAX_ID", sql.Int, numOrNull(charge.TAX_ID))
      .input("TAX_PERCENTAGE", sql.Decimal(15, 3), amtOrNull(charge.TAX_PERCENTAGE))
      .input("TAX_AMOUNT_FC", sql.Decimal(15, 3), amtOrNull(charge.TAX_AMOUNT_FC))
      .input("FINAL_AMOUNT_FC", sql.Decimal(15, 3), amtOrNull(charge.FINAL_AMOUNT_FC))
      .input("EXCHANGE_RATE", sql.Decimal(15, 6), amtOrNull(charge.EXCHANGE_RATE))
      .input("TOTAL_AMOUNT_LC", sql.Decimal(15, 3), amtOrNull(charge.TOTAL_AMOUNT_LC))
      .input("TAX_AMOUNT_LC", sql.Decimal(15, 3), amtOrNull(charge.TAX_AMOUNT_LC))
      .input("FINAL_AMOUNT_LC", sql.Decimal(15, 3), amtOrNull(charge.FINAL_AMOUNT_LC))
      .input("REMARKS", sql.VarChar(500), charge.REMARKS || null)
      .input("STATUS_ENTRY", sql.VarChar(20), charge.STATUS_ENTRY || "CF")
      .input("USER", sql.VarChar(50), charge.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), charge.MAC_ADDRESS || "WEB")
      .execute("VPurchase.SAVE_PURCHASE_ORDER_ADDITIONAL_CHARGES_DTL");

    const { message, data: id } = parseSprocResult(
      result.recordset?.[0],
      "Failed to save additional charge"
    );

    return { message: message || "Additional Charge saved successfully", id: Number(id) ?? null };
  } catch (error) {
    console.error("SAVE_PURCHASE_ORDER_ADDITIONAL_CHARGES_DTL SP error:", error);
    throw error;
  }
};

/* ------------------------------------------------------------ update */
export const updatePurchaseOrderAdditionalChargeService = async (data: PurchaseOrderAdditionalChargeData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const headerRate = await fetchHeaderExchangeRate(data.PURCHASE_ORDER_NO);
    const taxPercentage = await resolveTaxPercentage(data);
    const charge = computeChargeAmounts({ ...data, EXCHANGE_RATE: data.EXCHANGE_RATE ?? headerRate, TAX_PERCENTAGE: taxPercentage });

    const result = await pool
      .request()
      .input("PURCHASE_ORDER_ADDITIONAL_CHARGES_ID", sql.Int, charge.PURCHASE_ORDER_ADDITIONAL_CHARGES_ID ?? 0)
      .input("PURCHASE_ORDER_NO", sql.VarChar(50), charge.PURCHASE_ORDER_NO)
      .input("PURCHASE_QUOTATION_NO", sql.VarChar(50), charge.PURCHASE_QUOTATION_NO || null)
      .input("PURCHASE_QUOTATION_ADDITIONAL_CHARGES_ID", sql.Int, numOrNull(charge.PURCHASE_QUOTATION_ADDITIONAL_CHARGES_ID))
      .input("LINE_NO", sql.Int, numOrNull(charge.LINE_NO) ?? 0)
      .input("ADDITIONAL_CHARGE_TYPE_ID", sql.Int, numOrNull(charge.ADDITIONAL_CHARGE_TYPE_ID))
      .input("DESCRIPTION", sql.VarChar(500), charge.DESCRIPTION || null)
      .input("QUANTITY", sql.Decimal(15, 3), amtOrNull(charge.QUANTITY))
      .input("UOM_ID", sql.Int, numOrNull(charge.UOM_ID))
      .input("RATE", sql.Decimal(15, 3), amtOrNull(charge.RATE))
      .input("TOTAL_AMOUNT_FC", sql.Decimal(15, 3), amtOrNull(charge.TOTAL_AMOUNT_FC))
      .input("TAX_ID", sql.Int, numOrNull(charge.TAX_ID))
      .input("TAX_PERCENTAGE", sql.Decimal(15, 3), amtOrNull(charge.TAX_PERCENTAGE))
      .input("TAX_AMOUNT_FC", sql.Decimal(15, 3), amtOrNull(charge.TAX_AMOUNT_FC))
      .input("FINAL_AMOUNT_FC", sql.Decimal(15, 3), amtOrNull(charge.FINAL_AMOUNT_FC))
      .input("EXCHANGE_RATE", sql.Decimal(15, 6), amtOrNull(charge.EXCHANGE_RATE))
      .input("TOTAL_AMOUNT_LC", sql.Decimal(15, 3), amtOrNull(charge.TOTAL_AMOUNT_LC))
      .input("TAX_AMOUNT_LC", sql.Decimal(15, 3), amtOrNull(charge.TAX_AMOUNT_LC))
      .input("FINAL_AMOUNT_LC", sql.Decimal(15, 3), amtOrNull(charge.FINAL_AMOUNT_LC))
      .input("REMARKS", sql.VarChar(500), charge.REMARKS || null)
      .input("STATUS_ENTRY", sql.VarChar(20), charge.STATUS_ENTRY || "CF")
      .input("USER", sql.VarChar(50), charge.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), charge.MAC_ADDRESS || "WEB")
      .execute("VPurchase.UPDATE_PURCHASE_ORDER_ADDITIONAL_CHARGES_DTL");

    const { message } = parseSprocResult(
      result.recordset?.[0],
      "Failed to update additional charge"
    );

    return { message: message || "Additional Charge updated successfully" };
  } catch (error) {
    console.error("UPDATE_PURCHASE_ORDER_ADDITIONAL_CHARGES_DTL SP error:", error);
    throw error;
  }
};

/* ------------------------------------------------------------ delete */
export const deletePurchaseOrderAdditionalChargeService = async (
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
      .input("PURCHASE_ORDER_ADDITIONAL_CHARGES_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VPurchase.DELETE_PURCHASE_ORDER_ADDITIONAL_CHARGES_DTL");

    const { message } = parseSprocResult(
      result.recordset?.[0],
      "Failed to delete additional charge"
    );

    return { message: message || "Additional Charge deleted successfully" };
  } catch (error) {
    console.error("DELETE_PURCHASE_ORDER_ADDITIONAL_CHARGES_DTL SP error:", error);
    throw error;
  }
};