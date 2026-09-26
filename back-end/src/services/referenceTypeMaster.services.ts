import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface ReferenceTypeMasterData {
  REFERENCE_TYPE_ID?: number;
  REFERENCE_TYPE_CODE: string;
  REFERENCE_TYPE_NAME: string;
  DESCRIPTION?: string | null;
  SORT_ORDER?: number | null;
  REMARKS?: string | null;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export interface ReferenceTypeMasterListFilter {
  status?: string | null;
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
    referenceTypeId: row.REFERENCE_TYPE_ID,
    referenceTypeCode: row.REFERENCE_TYPE_CODE,
    referenceTypeName: row.REFERENCE_TYPE_NAME,
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

export const saveReferenceTypeMasterService = async (data: ReferenceTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("REFERENCE_TYPE_CODE", sql.VarChar(30), data.REFERENCE_TYPE_CODE || null)
      .input("REFERENCE_TYPE_NAME", sql.VarChar(100), data.REFERENCE_TYPE_NAME || null)
      .input("DESCRIPTION", sql.VarChar(500), data.DESCRIPTION || null)
      .input("SORT_ORDER", sql.Int, toNullableInt(data.SORT_ORDER))
      .input("REMARKS", sql.VarChar(100), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || "ACTIVE")
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMASTER.SAVE_REFERENCE_TYPE_MASTER");

    const { status, message, data: id } = parseSprocResult(
      result.recordset?.[0],
      "Failed to save reference type"
    );

    return { message: message || "Reference Type saved successfully", id: Number(id) || null };
  } catch (error) {
    console.error("SAVE_REFERENCE_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const updateReferenceTypeMasterService = async (data: ReferenceTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("REFERENCE_TYPE_ID", sql.Int, data.REFERENCE_TYPE_ID ?? 0)
      .input("REFERENCE_TYPE_CODE", sql.VarChar(30), data.REFERENCE_TYPE_CODE || null)
      .input("REFERENCE_TYPE_NAME", sql.VarChar(100), data.REFERENCE_TYPE_NAME || null)
      .input("DESCRIPTION", sql.VarChar(500), data.DESCRIPTION || null)
      .input("SORT_ORDER", sql.Int, toNullableInt(data.SORT_ORDER))
      .input("REMARKS", sql.VarChar(100), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMASTER.UPDATE_REFERENCE_TYPE_MASTER");

    const { status, message } = parseSprocResult(
      result.recordset?.[0],
      "Failed to update reference type"
    );

    return { message: message || "Reference Type updated successfully" };
  } catch (error) {
    console.error("UPDATE_REFERENCE_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const deleteReferenceTypeMasterService = async (
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
      .input("REFERENCE_TYPE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMASTER.DELETE_REFERENCE_TYPE_MASTER");

    const { status, message } = parseSprocResult(
      result.recordset?.[0],
      "Failed to delete reference type"
    );

    return { message: message || "Reference Type deleted successfully" };
  } catch (error) {
    console.error("DELETE_REFERENCE_TYPE_MASTER SP error:", error);
    throw error;
  }
};

/**
 * List reference types with optional server-side status/search filtering.
 * The SP returns "Total + page rows" (two result sets) when paging is
 * requested; it falls back to a single result-set when paging is off.
 */
export const getReferenceTypeMasterListService = async (
  filter: ReferenceTypeMasterListFilter = {}
): Promise<{ total: number; rows: any[] }> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("REFERENCE_TYPE_ID", sql.Int, null)
      .input("Status", sql.VarChar(20), filter.status || "ALL")
      .input("Search", sql.NVarChar(200), filter.search || null)
      .input("Page", sql.Int, toNullablePage(filter.page))
      .input("PageSize", sql.Int, toNullablePage(filter.pageSize))
      .execute("VMASTER.GET_REFERENCE_TYPE_MASTER");

    const recordsets = (result.recordsets || []) as any[][];
    if (recordsets.length >= 2) {
      const rows = recordsets[1] || [];
      const total = Number(recordsets[0]?.[0]?.Total ?? 0);
      return { total, rows };
    }
    const rows = recordsets[0] || [];
    return { total: rows.length, rows };
  } catch (error) {
    console.error("GET_REFERENCE_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const getReferenceTypeMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("REFERENCE_TYPE_ID", sql.Int, id)
      .execute("VMASTER.GET_REFERENCE_TYPE_MASTER");

    return mapSingleRowToFrontend(result.recordset?.[0] || null);
  } catch (error) {
    console.error("GET_REFERENCE_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const loadReferenceTypeMasterOptionsService = async (includeInactive = false) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("IncludeInactive", sql.Bit, includeInactive ? 1 : 0)
      .execute("VMASTER.LOAD_REFERENCE_TYPE_MASTER");

    return result.recordset || [];
  } catch (error) {
    console.error("LOAD_REFERENCE_TYPE_MASTER SP error:", error);
    throw error;
  }
};