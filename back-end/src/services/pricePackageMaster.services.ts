import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface PricePackageMasterData {
  PRICE_PACKAGE_ID?: number;
  PRICE_PACKAGE_TYPE?: string;
  PRICE_PACKAGE_NAME: string;
  PRICE_PACKAGE_DAYS?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
  LINK_ID?: number | null;
}

const toInt = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

export const getAllPricePackageMasterService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .execute("VMaster.SHOW_PRICE_PACKAGE_MASTER");

    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_PRICE_PACKAGE_MASTER SP error:", error);
    // Fallback to query
    const fallback = await pool.request().query(`
      SELECT PRICE_PACKAGE_ID, PRICE_PACKAGE_TYPE, PRICE_PACKAGE_NAME,
             PRICE_PACKAGE_DAYS, REMARKS, STATUS_MASTER, LINK_ID
      FROM [VMaster].[TBL_PRICE_PACKAGE_MASTER]
      ORDER BY PRICE_PACKAGE_NAME
    `);
    return fallback.recordset || [];
  }
};

export const getPricePackageMasterByIdService = async (id: number, linkId?: number | null) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const resolvedLinkId = toInt(linkId) ?? 104;

  try {
    const result = await pool
      .request()
      .input("PRICE_PACKAGE_ID", sql.Int, id)
      .input("LINK_ID", sql.Int, resolvedLinkId)
      .execute("VMaster.GET_PRICE_PACKAGE_MASTER");

    if (result.recordset?.[0]) {
      return result.recordset[0];
    }

    // Fallback in case record exists with different/null link_id
    const fallback = await pool
      .request()
      .input("PRICE_PACKAGE_ID", sql.Int, id)
      .query(`
        SELECT PRICE_PACKAGE_ID, PRICE_PACKAGE_TYPE, PRICE_PACKAGE_NAME,
               PRICE_PACKAGE_DAYS, REMARKS, STATUS_MASTER, CREATED_BY, LINK_ID
        FROM [VMaster].[TBL_PRICE_PACKAGE_MASTER]
        WHERE PRICE_PACKAGE_ID = @PRICE_PACKAGE_ID
      `);

    return fallback.recordset?.[0] || null;
  } catch (error) {
    console.error("GET_PRICE_PACKAGE_MASTER SP error:", error);
    throw error;
  }
};

export const savePricePackageMasterService = async (data: PricePackageMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PRICE_PACKAGE_ID", sql.Int, toInt(data.PRICE_PACKAGE_ID) ?? 0)
      .input("PRICE_PACKAGE_TYPE", sql.VarChar(50), data.PRICE_PACKAGE_TYPE || null)
      .input("PRICE_PACKAGE_NAME", sql.VarChar(50), data.PRICE_PACKAGE_NAME)
      .input("PRICE_PACKAGE_DAYS", sql.Int, toInt(data.PRICE_PACKAGE_DAYS))
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || "ACTIVE")
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .input("LINK_ID", sql.Int, toInt(data.LINK_ID) ?? 104)
      .execute("VMaster.SAVE_PRICE_PACKAGE_MASTER");

    const { message, data: savedId } = parseSprocResult(result.recordset?.[0], "Failed to save price package");

    let newId = toInt(savedId) || toInt(data.PRICE_PACKAGE_ID);
    if (!newId || newId === 0) {
      const idRes = await pool
        .request()
        .input("PRICE_PACKAGE_NAME", sql.VarChar(50), data.PRICE_PACKAGE_NAME)
        .query(
          `SELECT TOP 1 PRICE_PACKAGE_ID FROM [VMaster].[TBL_PRICE_PACKAGE_MASTER] WHERE UPPER(PRICE_PACKAGE_NAME) = UPPER(@PRICE_PACKAGE_NAME) ORDER BY PRICE_PACKAGE_ID DESC`
        );
      newId = idRes.recordset?.[0]?.PRICE_PACKAGE_ID;
    }

    return {
      message: message || "Data Saved Successfully",
      PRICE_PACKAGE_ID: newId,
    };
  } catch (error) {
    console.error("SAVE_PRICE_PACKAGE_MASTER SP error:", error);
    throw error;
  }
};

export const updatePricePackageMasterService = async (data: PricePackageMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PRICE_PACKAGE_ID", sql.Int, toInt(data.PRICE_PACKAGE_ID))
      .input("PRICE_PACKAGE_TYPE", sql.VarChar(50), data.PRICE_PACKAGE_TYPE ?? null)
      .input("PRICE_PACKAGE_NAME", sql.VarChar(50), data.PRICE_PACKAGE_NAME ?? null)
      .input("PRICE_PACKAGE_DAYS", sql.Int, toInt(data.PRICE_PACKAGE_DAYS))
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? "ACTIVE")
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .input("LINK_ID", sql.Int, toInt(data.LINK_ID) ?? 104)
      .execute("VMaster.UPDATE_PRICE_PACKAGE_MASTER");

    const { message, data: updatedId } = parseSprocResult(result.recordset?.[0], "Failed to update price package");

    return {
      message: message || "Record Updated Successfully",
      PRICE_PACKAGE_ID: toInt(updatedId) || toInt(data.PRICE_PACKAGE_ID),
    };
  } catch (error) {
    console.error("UPDATE_PRICE_PACKAGE_MASTER SP error:", error);
    throw error;
  }
};

export const deletePricePackageMasterService = async (
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
      .input("PRICE_PACKAGE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_PRICE_PACKAGE_MASTER");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to delete price package");

    return { message: message || "Data Deleted Successfully" };
  } catch (error) {
    console.error("DELETE_PRICE_PACKAGE_MASTER SP error:", error);
    throw error;
  }
};
