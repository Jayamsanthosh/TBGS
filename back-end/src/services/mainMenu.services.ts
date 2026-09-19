import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface MainMenuData {
  MAIN_MENU_ID?: number;
  MAIN_MENU_NAME: string;
  MAIN_MENU_LOCATION: string;
  MAIN_MENU_SEQ_ID: number;
  STATUS_MASTER: string;
  STYLE_CSS: string;
  PAGE_ACTION: string;
  USER?: string;
}

export const getAllMainMenuService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool.request().execute("VMaster.SHOW_MAIN_MENU");
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_MAIN_MENU SP error:", error);
    throw error;
  }
};

export const getMainMenuByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("MAIN_MENU_ID", sql.Int, id)
      .execute("VMaster.GET_MAIN_MENU");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_MAIN_MENU SP error:", error);
    throw error;
  }
};

// Normalize status values to match DB convention ('AC' for Active)
const normalizeStatus = (status: string | undefined | null): string => {
  if (!status) return 'AC';
  const s = status.trim().toUpperCase();
  if (s === 'ACTIVE' || s === 'AC') return 'AC';
  if (s === 'INACTIVE' || s === 'IN') return 'IN';
  return s.substring(0, 2); // fallback: take first 2 chars
};

export const saveMainMenuService = async (menu: MainMenuData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("MAIN_MENU_NAME", sql.VarChar(100), menu.MAIN_MENU_NAME || null)
      .input("MAIN_MENU_LOCATION", sql.VarChar(100), menu.MAIN_MENU_LOCATION || null)
      .input("MAIN_MENU_SEQ_ID", sql.Int, menu.MAIN_MENU_SEQ_ID ?? 0)
      .input("STATUS_MASTER", sql.VarChar(20), normalizeStatus(menu.STATUS_MASTER))
      .input("STYLE_CSS", sql.VarChar(1000), menu.STYLE_CSS || null)
      .input("PAGE_ACTION", sql.VarChar(100), menu.PAGE_ACTION || null)
      .input("USER", sql.VarChar(50), menu.USER || "Admin")
      .execute("VMaster.SAVE_MAIN_MENU");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save main menu");

    return { newMenuId: savedData, message };
  } catch (error) {
    console.error("SAVE_MAIN_MENU SP error:", error);
    throw error;
  }
};

export const updateMainMenuService = async (menu: MainMenuData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("MAIN_MENU_ID", sql.Int, menu.MAIN_MENU_ID ?? 0)
      .input("MAIN_MENU_NAME", sql.VarChar(100), menu.MAIN_MENU_NAME ?? null)
      .input("MAIN_MENU_LOCATION", sql.VarChar(100), menu.MAIN_MENU_LOCATION ?? null)
      .input("MAIN_MENU_SEQ_ID", sql.Int, menu.MAIN_MENU_SEQ_ID ?? 0)
      .input("STATUS_MASTER", sql.VarChar(20), normalizeStatus(menu.STATUS_MASTER))
      .input("STYLE_CSS", sql.VarChar(1000), menu.STYLE_CSS ?? null)
      .input("PAGE_ACTION", sql.VarChar(100), menu.PAGE_ACTION ?? null)
      .input("USER", sql.VarChar(50), menu.USER ?? "Admin")
      .execute("VMaster.UPDATE_MAIN_MENU");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to update main menu");

    return { message };
  } catch (error) {
    console.error("UPDATE_MAIN_MENU SP error:", error);
    throw error;
  }
};

export const deleteMainMenuService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("MAIN_MENU_ID", sql.Int, id)
      .execute("VMaster.DELETE_MAIN_MENU");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to delete main menu");

    return { message };
  } catch (error) {
    console.error("DELETE_MAIN_MENU SP error:", error);
    throw error;
  }
};