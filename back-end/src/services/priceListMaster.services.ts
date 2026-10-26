import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface PriceListMasterData {
  PRICE_LIST_ID?: number;
  PRICE_TYPE_ID?: number;
  COMPANY_ID?: number;
  PRICE_PACKAGE_ID?: number;
  PER_DAY_OR_TRIP_OR_QTY_PRICE?: number;
  FOOD_LIMIT_AMOUNT?: number;
  DRINKS_LIMIT_AMOUNT?: number;
  ACCOMDATION_LIMIT_AMOUNT?: number;
  CURRENCY_ID?: number;
  EFFECTIVE_FROM?: string | Date | null;
  EFFECTIVE_TO?: string | Date | null;
  REQUESTED_BY?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
  LINK_ID?: number | null;
}

const toInt = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

const toDecimal = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

const toDate = (v: any): Date | null => {
  if (v === undefined || v === null || v === "") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const getAllPriceListMasterService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool.request().query(`
      SELECT
        A.PRICE_LIST_ID,
        A.PRICE_TYPE_ID,        T.PRICE_TYPE_NAME,
        A.COMPANY_ID,           C.COMPANY_NAME,
        A.PRICE_PACKAGE_ID,     P.PRICE_PACKAGE_NAME,
        A.CURRENCY_ID,          CU.CURRENCY_NAME,
        A.PER_DAY_OR_TRIP_OR_QTY_PRICE,
        A.FOOD_LIMIT_AMOUNT,
        A.DRINKS_LIMIT_AMOUNT,
        A.ACCOMDATION_LIMIT_AMOUNT,
        A.EFFECTIVE_FROM,
        A.EFFECTIVE_TO,
        A.REQUESTED_BY,
        A.REQUESTED_DATE,
        A.REMARKS,
        A.STATUS_MASTER,
        A.LINK_ID
      FROM [VMaster].[TBL_PRICE_LIST_MASTER] A
      LEFT JOIN [VMaster].[TBL_COMPANY_MASTER] C ON A.COMPANY_ID = C.COMPANY_ID
      LEFT JOIN [VMaster].[TBL_PRICE_PACKAGE_MASTER] P ON A.PRICE_PACKAGE_ID = P.PRICE_PACKAGE_ID
      LEFT JOIN [VMaster].[TBL_PRICE_TYPE_MASTER] T ON A.PRICE_TYPE_ID = T.PRICE_TYPE_ID
      LEFT JOIN [VMaster].[TBL_CURRENCY_MASTER] CU ON A.CURRENCY_ID = CU.CURRENCY_ID
      ORDER BY A.PRICE_LIST_ID
    `);
    return result.recordset || [];
  } catch (error) {
    console.error("getAllPriceListMaster error:", error);
    throw error;
  }
};

export const getPriceListMasterByIdService = async (id: number, linkId?: number | null) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const resolvedLinkId = toInt(linkId) ?? 105;

  try {
    const result = await pool
      .request()
      .input("PRICE_LIST_ID", sql.Int, id)
      .input("LINK_ID", sql.Int, resolvedLinkId)
      .execute("VMaster.GET_PRICE_LIST_MASTER");

    if (result.recordset?.[0]) {
      return result.recordset[0];
    }

    // Fallback in case of record with different/null link_id
    const fallback = await pool
      .request()
      .input("PRICE_LIST_ID", sql.Int, id)
      .query(`SELECT * FROM [VMaster].[TBL_PRICE_LIST_MASTER] WHERE PRICE_LIST_ID = @PRICE_LIST_ID`);

    return fallback.recordset?.[0] || null;
  } catch (error) {
    console.error("GET_PRICE_LIST_MASTER SP error:", error);
    throw error;
  }
};

export const savePriceListMasterService = async (data: PriceListMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PRICE_LIST_ID", sql.Int, toInt(data.PRICE_LIST_ID) ?? 0)
      .input("PRICE_TYPE_ID", sql.Int, toInt(data.PRICE_TYPE_ID))
      .input("COMPANY_ID", sql.Int, toInt(data.COMPANY_ID))
      .input("PRICE_PACKAGE_ID", sql.Int, toInt(data.PRICE_PACKAGE_ID))
      .input("PER_DAY_OR_TRIP_OR_QTY_PRICE", sql.Decimal(15, 2), toDecimal(data.PER_DAY_OR_TRIP_OR_QTY_PRICE))
      .input("FOOD_LIMIT_AMOUNT", sql.Decimal(15, 2), toDecimal(data.FOOD_LIMIT_AMOUNT))
      .input("DRINKS_LIMIT_AMOUNT", sql.Decimal(15, 2), toDecimal(data.DRINKS_LIMIT_AMOUNT))
      .input("ACCOMDATION_LIMIT_AMOUNT", sql.Decimal(15, 2), toDecimal(data.ACCOMDATION_LIMIT_AMOUNT))
      .input("CURRENCY_ID", sql.Int, toInt(data.CURRENCY_ID))
      .input("EFFECTIVE_FROM", sql.DateTime, toDate(data.EFFECTIVE_FROM))
      .input("EFFECTIVE_TO", sql.DateTime, toDate(data.EFFECTIVE_TO))
      .input("REQUESTED_BY", sql.VarChar(50), data.REQUESTED_BY || data.USER || "Admin")
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || "ACTIVE")
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .input("LINK_ID", sql.Int, toInt(data.LINK_ID) ?? 105)
      .execute("VMaster.SAVE_PRICE_LIST_MASTER");

    const { message, data: savedId } = parseSprocResult(result.recordset?.[0], "Failed to save price list");

    let newId = toInt(savedId) || toInt(data.PRICE_LIST_ID);
    if (!newId || newId === 0) {
      const idRes = await pool
        .request()
        .input("COMPANY_ID", sql.Int, toInt(data.COMPANY_ID))
        .input("PRICE_TYPE_ID", sql.Int, toInt(data.PRICE_TYPE_ID))
        .query(
          `SELECT TOP 1 PRICE_LIST_ID FROM [VMaster].[TBL_PRICE_LIST_MASTER] WHERE COMPANY_ID = @COMPANY_ID AND PRICE_TYPE_ID = @PRICE_TYPE_ID ORDER BY PRICE_LIST_ID DESC`
        );
      newId = idRes.recordset?.[0]?.PRICE_LIST_ID;
    }

    return {
      message: message || "Data Saved Successfully",
      PRICE_LIST_ID: newId,
    };
  } catch (error) {
    console.error("SAVE_PRICE_LIST_MASTER SP error:", error);
    throw error;
  }
};

export const updatePriceListMasterService = async (data: PriceListMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PRICE_LIST_ID", sql.Int, toInt(data.PRICE_LIST_ID))
      .input("PRICE_TYPE_ID", sql.Int, toInt(data.PRICE_TYPE_ID))
      .input("COMPANY_ID", sql.Int, toInt(data.COMPANY_ID))
      .input("PRICE_PACKAGE_ID", sql.Int, toInt(data.PRICE_PACKAGE_ID))
      .input("PER_DAY_OR_TRIP_OR_QTY_PRICE", sql.Decimal(15, 2), toDecimal(data.PER_DAY_OR_TRIP_OR_QTY_PRICE))
      .input("FOOD_LIMIT_AMOUNT", sql.Decimal(15, 2), toDecimal(data.FOOD_LIMIT_AMOUNT))
      .input("DRINKS_LIMIT_AMOUNT", sql.Decimal(15, 2), toDecimal(data.DRINKS_LIMIT_AMOUNT))
      .input("ACCOMDATION_LIMIT_AMOUNT", sql.Decimal(15, 2), toDecimal(data.ACCOMDATION_LIMIT_AMOUNT))
      .input("CURRENCY_ID", sql.Int, toInt(data.CURRENCY_ID))
      .input("EFFECTIVE_FROM", sql.DateTime, toDate(data.EFFECTIVE_FROM))
      .input("EFFECTIVE_TO", sql.DateTime, toDate(data.EFFECTIVE_TO))
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? "ACTIVE")
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .input("LINK_ID", sql.Int, toInt(data.LINK_ID) ?? 105)
      .execute("VMaster.UPDATE_PRICE_LIST_MASTER");

    const { message, data: updatedId } = parseSprocResult(result.recordset?.[0], "Failed to update price list");

    return {
      message: message || "Record Updated Successfully",
      PRICE_LIST_ID: toInt(updatedId) || toInt(data.PRICE_LIST_ID),
    };
  } catch (error) {
    console.error("UPDATE_PRICE_LIST_MASTER SP error:", error);
    throw error;
  }
};

export const deletePriceListMasterService = async (
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
      .input("PRICE_LIST_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_PRICE_LIST_MASTER");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to delete price list");

    return { message: message || "Data Deleted Successfully" };
  } catch (error) {
    console.error("DELETE_PRICE_LIST_MASTER SP error:", error);
    throw error;
  }
};
