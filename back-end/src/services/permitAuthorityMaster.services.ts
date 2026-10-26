import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface PermitAuthorityMasterData {
  PERMIT_AUTHORITY_ID?: number;
  PERMIT_AUTHORITY_NAME: string;
  COUNTRY_ID?: number;
  CONTACT_PERSON?: string;
  CONTACT_NUMBER?: string;
  EMAIL?: string;
  WEBSITE?: string;
  ADDRESS?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
  LINK_ID?: number | null;
}

const toInt = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

export const getAllPermitAuthorityMasterService = async (status: string = "ALL") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(10), status || "ALL")
      .execute("VMaster.SHOW_PERMIT_AUTHORITY_MASTER");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_PERMIT_AUTHORITY_MASTER SP error:", error);
    const fallback = await pool.request().query(`
      SELECT
        a.[PERMIT_AUTHORITY_ID],
        a.[PERMIT_AUTHORITY_NAME],
        a.[COUNTRY_ID],
        c.COUNTRY_NAME,
        a.[CONTACT_PERSON],
        a.[CONTACT_NUMBER],
        a.[EMAIL],
        a.[WEBSITE],
        a.[ADDRESS],
        a.[REMARKS],
        a.[STATUS_MASTER],
        a.[LINK_ID]
      FROM [VMaster].[TBL_PERMIT_AUTHORITY_MASTER] a
      LEFT JOIN VMaster.TBL_COUNTRY_MASTER c ON a.COUNTRY_ID = c.COUNTRY_ID
      ORDER BY a.PERMIT_AUTHORITY_ID
    `);
    return fallback.recordset || [];
  }
};

export const getPermitAuthorityMasterByIdService = async (id: number, linkId?: number | null) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const resolvedLinkId = toInt(linkId) ?? 252;

  try {
    const result = await pool
      .request()
      .input("PERMIT_AUTHORITY_ID", sql.Int, id)
      .input("LINK_ID", sql.Int, resolvedLinkId)
      .execute("VMaster.GET_PERMIT_AUTHORITY_MASTER");

    if (result.recordset?.[0]) {
      return result.recordset[0];
    }

    // Fallback if record exists with different/null link_id
    const fallback = await pool
      .request()
      .input("PERMIT_AUTHORITY_ID", sql.Int, id)
      .query(`
        SELECT * FROM [VMaster].[TBL_PERMIT_AUTHORITY_MASTER]
        WHERE PERMIT_AUTHORITY_ID = @PERMIT_AUTHORITY_ID
      `);

    return fallback.recordset?.[0] || null;
  } catch (error) {
    console.error("GET_PERMIT_AUTHORITY_MASTER SP error:", error);
    throw error;
  }
};

export const savePermitAuthorityMasterService = async (data: PermitAuthorityMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PERMIT_AUTHORITY_ID", sql.Int, toInt(data.PERMIT_AUTHORITY_ID) ?? 0)
      .input("PERMIT_AUTHORITY_NAME", sql.VarChar(150), data.PERMIT_AUTHORITY_NAME || null)
      .input("COUNTRY_ID", sql.Int, toInt(data.COUNTRY_ID))
      .input("CONTACT_PERSON", sql.VarChar(100), data.CONTACT_PERSON || null)
      .input("CONTACT_NUMBER", sql.VarChar(50), data.CONTACT_NUMBER || null)
      .input("EMAIL", sql.VarChar(100), data.EMAIL || null)
      .input("WEBSITE", sql.VarChar(200), data.WEBSITE || null)
      .input("ADDRESS", sql.VarChar(500), data.ADDRESS || null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || "ACTIVE")
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .input("LINK_ID", sql.Int, toInt(data.LINK_ID) ?? 252)
      .execute("VMaster.SAVE_PERMIT_AUTHORITY_MASTER");

    const { message, data: savedId } = parseSprocResult(result.recordset?.[0], "Failed to save permit authority");

    let newId = toInt(savedId) || toInt(data.PERMIT_AUTHORITY_ID);
    if (!newId || newId === 0) {
      const idRes = await pool
        .request()
        .input("PERMIT_AUTHORITY_NAME", sql.VarChar(150), data.PERMIT_AUTHORITY_NAME)
        .query(
          `SELECT TOP 1 PERMIT_AUTHORITY_ID FROM [VMaster].[TBL_PERMIT_AUTHORITY_MASTER] WHERE PERMIT_AUTHORITY_NAME = @PERMIT_AUTHORITY_NAME ORDER BY PERMIT_AUTHORITY_ID DESC`
        );
      newId = idRes.recordset?.[0]?.PERMIT_AUTHORITY_ID;
    }

    return {
      message: message || "Data Saved Successfully",
      PERMIT_AUTHORITY_ID: newId,
    };
  } catch (error) {
    console.error("SAVE_PERMIT_AUTHORITY_MASTER SP error:", error);
    throw error;
  }
};

export const updatePermitAuthorityMasterService = async (data: PermitAuthorityMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PERMIT_AUTHORITY_ID", sql.Int, toInt(data.PERMIT_AUTHORITY_ID))
      .input("PERMIT_AUTHORITY_NAME", sql.VarChar(150), data.PERMIT_AUTHORITY_NAME ?? null)
      .input("COUNTRY_ID", sql.Int, toInt(data.COUNTRY_ID))
      .input("CONTACT_PERSON", sql.VarChar(100), data.CONTACT_PERSON ?? null)
      .input("CONTACT_NUMBER", sql.VarChar(50), data.CONTACT_NUMBER ?? null)
      .input("EMAIL", sql.VarChar(100), data.EMAIL ?? null)
      .input("WEBSITE", sql.VarChar(200), data.WEBSITE ?? null)
      .input("ADDRESS", sql.VarChar(500), data.ADDRESS ?? null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? "ACTIVE")
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .input("LINK_ID", sql.Int, toInt(data.LINK_ID) ?? 252)
      .execute("VMaster.UPDATE_PERMIT_AUTHORITY_MASTER");

    const { message, data: updatedId } = parseSprocResult(result.recordset?.[0], "Failed to update permit authority");

    return {
      message: message || "Data Updated Successfully",
      PERMIT_AUTHORITY_ID: toInt(updatedId) || toInt(data.PERMIT_AUTHORITY_ID),
    };
  } catch (error) {
    console.error("UPDATE_PERMIT_AUTHORITY_MASTER SP error:", error);
    throw error;
  }
};

export const deletePermitAuthorityMasterService = async (
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
      .input("PERMIT_AUTHORITY_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_PERMIT_AUTHORITY_MASTER");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to delete permit authority");

    return { message: message || "Data Deleted Successfully" };
  } catch (error) {
    console.error("DELETE_PERMIT_AUTHORITY_MASTER SP error:", error);
    throw error;
  }
};