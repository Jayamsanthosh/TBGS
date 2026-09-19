import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface LinksAndPagesData {
  LINK_ID?: number;
  SUB_MENU_ID: number;
  LINK_NAME: string;
  PAGE_ACTION: string;
  REDIRECTION_TYPE: string;
  LINK_LOCATION: string;
  LINK_SEQ_ID: number;
  STYLE_CSS: string;
  STATUS_MASTER: string;
  USER?: string;
}

export const getAllLinksAndPagesService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .execute("VMaster.SHOW_LINKS_AND_PAGES");

    return (result.recordset || []).map((row: any) => ({
      ...row,
      STATUS_MASTER: row.STATUS ?? row.STATUS_MASTER,
    }));
  } catch (error) {
    console.error("SHOW_LINKS_AND_PAGES SP error:", error);
    throw error;
  }
};

export const getLinkAndPageByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("LINK_ID", sql.Int, id)
      .execute("VMaster.GET_LINKS_AND_PAGES");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_LINKS_AND_PAGES SP error:", error);
    throw error;
  }
};

// Normalize status values to match DB convention ('AC' for Active)
const normalizeStatus = (status: string | undefined | null): string => {
  if (!status) return 'AC';
  const s = status.trim().toUpperCase();
  if (s === 'ACTIVE' || s === 'AC') return 'AC';
  if (s === 'INACTIVE' || s === 'IN') return 'IN';
  return s.substring(0, 2);
};

export const saveLinkAndPageService = async (data: LinksAndPagesData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("LINK_ID", sql.Int, data.LINK_ID ?? 0)
      .input("SUB_MENU_ID", sql.Int, data.SUB_MENU_ID ?? 0)
      .input("LINK_NAME", sql.VarChar(100), data.LINK_NAME || null)
      .input("PAGE_ACTION", sql.VarChar(100), data.PAGE_ACTION || null)
      .input("REDIRECTION_TYPE", sql.VarChar(100), data.REDIRECTION_TYPE || null)
      .input("LINK_LOCATION", sql.VarChar(100), data.LINK_LOCATION || null)
      .input("LINK_SEQ_ID", sql.Int, data.LINK_SEQ_ID ?? 0)
      .input("STYLE_CSS", sql.VarChar(1000), data.STYLE_CSS || null)
      .input("STATUS_MASTER", sql.VarChar(20), normalizeStatus(data.STATUS_MASTER))
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .execute("VMaster.SAVE_LINKS_AND_PAGES");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to save link");

    return { message: message || "Link saved successfully" };
  } catch (error) {
    console.error("SAVE_LINKS_AND_PAGES SP error:", error);
    throw error;
  }
};

export const updateLinkAndPageService = async (data: LinksAndPagesData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("LINK_ID", sql.Int, data.LINK_ID ?? 0)
      .input("SUB_MENU_ID", sql.Int, data.SUB_MENU_ID ?? 0)
      .input("LINK_NAME", sql.VarChar(100), data.LINK_NAME ?? null)
      .input("PAGE_ACTION", sql.VarChar(100), data.PAGE_ACTION ?? null)
      .input("REDIRECTION_TYPE", sql.VarChar(100), data.REDIRECTION_TYPE ?? null)
      .input("LINK_LOCATION", sql.VarChar(100), data.LINK_LOCATION ?? null)
      .input("LINK_SEQ_ID", sql.Int, data.LINK_SEQ_ID ?? 0)
      .input("STYLE_CSS", sql.VarChar(1000), data.STYLE_CSS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), normalizeStatus(data.STATUS_MASTER))
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .execute("VMaster.UPDATE_LINKS_AND_PAGES");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to update link");

    return { message: message || "Link updated successfully" };
  } catch (error) {
    console.error("UPDATE_LINKS_AND_PAGES SP error:", error);
    throw error;
  }
};

export const deleteLinkAndPageService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    await pool
      .request()
      .input("LINK_ID", sql.Int, id)
      .query("DELETE FROM [vmaster].[TBL_ROLE_TO_LINK_AND_PAGE] WHERE [LINK_ID_ROLE_TO_LINK] = @LINK_ID");

    const result = await pool
      .request()
      .input("LINK_ID", sql.Int, id)
      .execute("VMaster.DELETE_LINKS_AND_PAGES");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to delete link");

    return { message: message || "Link deleted successfully" };
  } catch (error) {
    console.error("DELETE_LINKS_AND_PAGES SP error:", error);
    throw error;
  }
};
