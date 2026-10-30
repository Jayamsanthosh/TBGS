import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface SubMenuMappingData {
  MAP_ID?: number;
  SUB_MENU_PARENT_ID?: number | null;
  CHILD_ID?: number | null;
  MAP_LOCATION?: string | null;
  LINK_ID?: number | null;
  STATUS_MASTER?: string | null;
  USER?: string | null;
  MAC_ADDRESS?: string | null;
}

const errorWithStatus = (message: string, httpStatus: number) => {
  const error = new Error(message) as Error & { httpStatus?: number };
  error.httpStatus = httpStatus;
  return error;
};

/* LINK_ID / SUB_MENU_PARENT_ID / CHILD_ID carry foreign keys; the proc
   validates them itself, but a direct FK violation is mapped defensively. */
const rethrowWriteError = (error: any): never => {
  if (error?.number === 547) throw errorWithStatus("Invalid parent, child or link selection", 400);
  throw error;
};

const nullableId = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "" || value === "none") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

/**
 * SHOW_SUB_MENU_MAPPING natively understands '' / NULL / 'ALL', exact
 * STATUS_MASTER matches and the ACTIVE<->AC / INACTIVE<->IN aliases.
 */
const showSubMenuMappings = async (status: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const result = await pool
    .request()
    .input("STATUS", sql.VarChar(10), status)
    .execute("VMaster.SHOW_SUB_MENU_MAPPING");

  return result.recordset || [];
};

export const getAllSubMenuMappingService = async (status?: string) => {
  const wanted = String(status ?? "ALL").trim().toUpperCase();

  try {
    if (!wanted || wanted === "ALL") {
      return await showSubMenuMappings("ALL");
    }

    if (wanted === "ACTIVE" || wanted === "AC") {
      return await showSubMenuMappings("AC");
    }

    if (wanted === "INACTIVE" || wanted === "IA" || wanted === "IN") {
      /* Rows can be stored as 'IA' by this app or as 'INACTIVE'/'IN' by older
         data; the proc maps 'IN' to STATUS_MASTER = 'INACTIVE' only, so run
         both spellings and merge. */
      const [ia, inactive] = await Promise.all([
        showSubMenuMappings("IA"),
        showSubMenuMappings("IN"),
      ]);

      const seen = new Set<number>();
      return [...ia, ...inactive].filter((row: any) => {
        const id = Number(row.MAP_ID);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    }

    return await showSubMenuMappings(wanted);
  } catch (error) {
    console.error("SHOW_SUB_MENU_MAPPING SP error:", error);
    throw error;
  }
};

/** GET_SUB_MENU_MAPPING only declares @MAP_ID. */
export const getSubMenuMappingByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("MAP_ID", sql.Int, id)
      .execute("VMaster.GET_SUB_MENU_MAPPING");

    return result.recordset?.[0] || null;
  } catch (error) {
    console.error("GET_SUB_MENU_MAPPING SP error:", error);
    throw error;
  }
};

/** SAVE_SUB_MENU_MAPPING has no @MAP_ID parameter (identity is generated). */
export const saveSubMenuMappingService = async (data: SubMenuMappingData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SUB_MENU_PARENT_ID", sql.Int, nullableId(data.SUB_MENU_PARENT_ID))
      .input("CHILD_ID", sql.Int, nullableId(data.CHILD_ID))
      .input("MAP_LOCATION", sql.VarChar(100), data.MAP_LOCATION || null)
      .input("LINK_ID", sql.Int, nullableId(data.LINK_ID))
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || "AC")
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_SUB_MENU_MAPPING");

    const { message, data: savedId } = parseSprocResult(
      result.recordset?.[0],
      "Failed to save sub menu mapping"
    );

    return {
      message: message || "Sub menu mapping saved successfully",
      MAP_ID:
        savedId !== undefined && savedId !== null && savedId !== ""
          ? Number(savedId)
          : undefined,
    };
  } catch (error) {
    console.error("SAVE_SUB_MENU_MAPPING SP error:", error);
    throw rethrowWriteError(error);
  }
};

export const updateSubMenuMappingService = async (data: SubMenuMappingData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const id = Number(data.MAP_ID);
  if (!Number.isFinite(id) || id <= 0) {
    throw errorWithStatus("Mapping ID is required", 400);
  }

  try {
    /* UPDATE_SUB_MENU_MAPPING already reports "Sub Menu Mapping Not Found",
       but the API answers with a real 404 to match the other masters. */
    const current = await getSubMenuMappingByIdService(id);
    if (!current) throw errorWithStatus("Sub menu mapping not found", 404);

    const result = await pool
      .request()
      .input("MAP_ID", sql.Int, id)
      .input("SUB_MENU_PARENT_ID", sql.Int, nullableId(data.SUB_MENU_PARENT_ID))
      .input("CHILD_ID", sql.Int, nullableId(data.CHILD_ID))
      .input("MAP_LOCATION", sql.VarChar(100), data.MAP_LOCATION || null)
      .input("LINK_ID", sql.Int, nullableId(data.LINK_ID))
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || "AC")
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.UPDATE_SUB_MENU_MAPPING");

    const { message } = parseSprocResult(
      result.recordset?.[0],
      "Failed to update sub menu mapping"
    );

    return { message: message || "Sub menu mapping updated successfully" };
  } catch (error) {
    console.error("UPDATE_SUB_MENU_MAPPING SP error:", error);
    throw rethrowWriteError(error);
  }
};

export const deleteSubMenuMappingService = async (
  id: number,
  user: string,
  role: string,
  macAddress: string
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    /* DELETE_SUB_MENU_MAPPING has its own existence check, but the API
       reports a missing row as 404 and keeps the exact 'Admin' role gate. */
    const current = await getSubMenuMappingByIdService(id);
    if (!current) throw errorWithStatus("Sub menu mapping not found", 404);

    const result = await pool
      .request()
      .input("MAP_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_SUB_MENU_MAPPING");

    const { message } = parseSprocResult(
      result.recordset?.[0],
      "No rights to delete sub menu mapping"
    );

    return { message: message || "Sub menu mapping deleted successfully" };
  } catch (error) {
    console.error("DELETE_SUB_MENU_MAPPING SP error:", error);
    throw error;
  }
};
