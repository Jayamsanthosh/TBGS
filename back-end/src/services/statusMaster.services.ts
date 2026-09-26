import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface StatusMasterData {
  STATUS_ID?: number;
  STATUS_CODE: string;
  STATUS_NAME: string;
  STATUS_CATEGORY?: string | null;
  DESCRIPTION?: string | null;
  SORT_ORDER?: number | null;
  REMARKS?: string | null;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export interface StatusMasterListFilter {
  status?: string | null;
  category?: string | null;
  search?: string | null;
  page?: number | null;
  pageSize?: number | null;
}

const toNullablePage = (v: number | null | undefined): number | null =>
  v == null || !Number.isFinite(v) || v < 1 ? null : Math.floor(v);

const toNullableInt = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

const mapSingleRowToFrontend = (row: any) => {
  if (!row) return null;
  return {
    statusId: row.STATUS_ID,
    statusCode: row.STATUS_CODE,
    statusName: row.STATUS_NAME,
    statusCategory: row.STATUS_CATEGORY,
    description: row.DESCRIPTION,
    sortOrder: row.SORT_ORDER,
    remarks: row.REMARKS,
    statusMaster: row.STATUS_MASTER,
    createdBy: row.CREATED_BY,
    createdDate: row.CREATED_DATE,
    createdMacAddress: row.CREATED_MAC_ADDRESS,
    modifiedBy: row.MODIFIED_BY,
    modifiedDate: row.MODIFIED_DATE,
    modifiedMacAddress: row.MODIFIED_MAC_ADDRESS,
  };
};

export const saveStatusMasterService = async (data: StatusMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("STATUS_CODE", sql.VarChar(30), data.STATUS_CODE || null)
      .input("STATUS_NAME", sql.VarChar(100), data.STATUS_NAME || null)
      .input("STATUS_CATEGORY", sql.VarChar(50), data.STATUS_CATEGORY || null)
      .input("DESCRIPTION", sql.VarChar(500), data.DESCRIPTION || null)
      .input("SORT_ORDER", sql.Int, toNullableInt(data.SORT_ORDER))
      .input("REMARKS", sql.VarChar(100), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || "ACTIVE")
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMASTER.SAVE_STATUS_MASTER");

    const { status, message, data: id } = parseSprocResult(
      result.recordset?.[0],
      "Failed to save status"
    );

    return { message: message || "Status saved successfully", id: Number(id) || null };
  } catch (error) {
    console.error("SAVE_STATUS_MASTER SP error:", error);
    throw error;
  }
};

export const updateStatusMasterService = async (data: StatusMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("STATUS_ID", sql.Int, data.STATUS_ID ?? 0)
      .input("STATUS_CODE", sql.VarChar(30), data.STATUS_CODE || null)
      .input("STATUS_NAME", sql.VarChar(100), data.STATUS_NAME || null)
      .input("STATUS_CATEGORY", sql.VarChar(50), data.STATUS_CATEGORY || null)
      .input("DESCRIPTION", sql.VarChar(500), data.DESCRIPTION || null)
      .input("SORT_ORDER", sql.Int, toNullableInt(data.SORT_ORDER))
      .input("REMARKS", sql.VarChar(100), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMASTER.UPDATE_STATUS_MASTER");

    const { status, message } = parseSprocResult(
      result.recordset?.[0],
      "Failed to update status"
    );

    return { message: message || "Status updated successfully" };
  } catch (error) {
    console.error("UPDATE_STATUS_MASTER SP error:", error);
    throw error;
  }
};

export const deleteStatusMasterService = async (
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
      .input("STATUS_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMASTER.DELETE_STATUS_MASTER");

    const { status, message } = parseSprocResult(
      result.recordset?.[0],
      "Failed to delete status"
    );

    return { message: message || "Status deleted successfully" };
  } catch (error) {
    console.error("DELETE_STATUS_MASTER SP error:", error);
    throw error;
  }
};

/**
 * List statuses with optional server-side status/category/search filtering.
 * The SP returns "Total + page rows" (two result sets) when paging is
 * requested; it falls back to a single result-set when paging is off.
 */
export const getStatusMasterListService = async (
  filter: StatusMasterListFilter = {}
): Promise<{ total: number; rows: any[] }> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("STATUS_ID", sql.Int, null)
      .input("Status", sql.VarChar(20), filter.status || "ALL")
      .input("Category", sql.VarChar(50), filter.category || null)
      .input("Search", sql.NVarChar(200), filter.search || null)
      .input("Page", sql.Int, toNullablePage(filter.page))
      .input("PageSize", sql.Int, toNullablePage(filter.pageSize))
      .execute("VMASTER.GET_STATUS_MASTER");

    const recordsets = (result.recordsets || []) as any[][];
    if (recordsets.length >= 2) {
      const rows = recordsets[1] || [];
      const total = Number(recordsets[0]?.[0]?.Total ?? 0);
      return { total, rows };
    }
    const rows = recordsets[0] || [];
    return { total: rows.length, rows };
  } catch (error) {
    console.error("GET_STATUS_MASTER SP error:", error);
    throw error;
  }
};

export const getStatusMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("STATUS_ID", sql.Int, id)
      .execute("VMASTER.GET_STATUS_MASTER");

    return mapSingleRowToFrontend(result.recordset?.[0] || null);
  } catch (error) {
    console.error("GET_STATUS_MASTER SP error:", error);
    throw error;
  }
};

export const loadStatusMasterOptionsService = async (
  category: string | null = null,
  includeInactive = false
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("Category", sql.VarChar(50), category || null)
      .input("IncludeInactive", sql.Bit, includeInactive ? 1 : 0)
      .execute("VMASTER.LOAD_STATUS_MASTER");

    return result.recordset || [];
  } catch (error) {
    console.error("LOAD_STATUS_MASTER SP error:", error);
    throw error;
  }
};