import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface SubMenuData {
  SUB_MENU_ID?: number;
  MAIN_MENU_ID: number;
  SUB_MENU_NAME: string;
  SUB_MENU_LOCATION: string;
  SUB_MENU_SEQ_ID: number;
  STYLE_CSS: string;
  PAGE_ACTION: string;
  IS_PARENT: string;
  STATUS_MASTER: string;
  USER?: string;
}

export const getAllSubMenuService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SUB_MENU_ID", sql.VarChar(50), "0")
      .execute("VMaster.SHOW_SUB_MENU");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_SUB_MENU SP error:", error);
    throw error;
  }
};

export const getSubMenuByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SUB_MENU_ID", sql.Int, id)
      .execute("VMaster.GET_SUB_MENU");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_SUB_MENU SP error:", error);
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

export const saveSubMenuService = async (menu: SubMenuData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("MAIN_MENU_ID", sql.Int, menu.MAIN_MENU_ID ?? 0)
      .input("SUB_MENU_NAME", sql.VarChar(100), menu.SUB_MENU_NAME || null)
      .input("SUB_MENU_LOCATION", sql.VarChar(100), menu.SUB_MENU_LOCATION || null)
      .input("SUB_MENU_SEQ_ID", sql.Int, menu.SUB_MENU_SEQ_ID ?? 0)
      .input("STYLE_CSS", sql.VarChar(1000), menu.STYLE_CSS || null)
      .input("PAGE_ACTION", sql.VarChar(100), menu.PAGE_ACTION || null)
      .input("IS_PARENT", sql.VarChar(25), menu.IS_PARENT || null)
      .input("STATUS_MASTER", sql.VarChar(20), normalizeStatus(menu.STATUS_MASTER))
      .input("USER", sql.VarChar(50), menu.USER || "Admin")
      .execute("VMaster.SAVE_SUB_MENU");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save sub menu");

    return { newSubMenuId: savedData, message };
  } catch (error) {
    console.error("SAVE_SUB_MENU SP error:", error);
    throw error;
  }
};

export const updateSubMenuService = async (menu: SubMenuData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SUB_MENU_ID", sql.Int, menu.SUB_MENU_ID ?? 0)
      .input("MAIN_MENU_ID", sql.Int, menu.MAIN_MENU_ID ?? 0)
      .input("SUB_MENU_NAME", sql.VarChar(100), menu.SUB_MENU_NAME ?? null)
      .input("SUB_MENU_LOCATION", sql.VarChar(100), menu.SUB_MENU_LOCATION ?? null)
      .input("SUB_MENU_SEQ_ID", sql.Int, menu.SUB_MENU_SEQ_ID ?? 0)
      .input("STYLE_CSS", sql.VarChar(1000), menu.STYLE_CSS ?? null)
      .input("PAGE_ACTION", sql.VarChar(100), menu.PAGE_ACTION ?? null)
      .input("IS_PARENT", sql.VarChar(25), menu.IS_PARENT ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), normalizeStatus(menu.STATUS_MASTER))
      .input("USER", sql.VarChar(50), menu.USER ?? "Admin")
      .execute("VMaster.UPDATE_SUB_MENU");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to update sub menu");

    return { message };
  } catch (error) {
    console.error("UPDATE_SUB_MENU SP error:", error);
    throw error;
  }
};

export const deleteSubMenuService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SUB_MENU_ID", sql.Int, id)
      .execute("VMaster.DELETE_SUB_MENU");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to delete sub menu");

    return { message };
  } catch (error) {
    console.error("DELETE_SUB_MENU SP error:", error);
    throw error;
  }
};