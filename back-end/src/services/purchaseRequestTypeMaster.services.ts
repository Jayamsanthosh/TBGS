import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface PurchaseRequestTypeData {
  REQUEST_TYPE_ID?: number;
  REQUEST_TYPE_CODE: string;
  REQUEST_TYPE_NAME: string;
  DESCRIPTION?: string | null;
  REMARKS?: string | null;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export interface PurchaseRequestTypeListFilter {
  status?: string | null;
  search?: string | null;
  page?: number | null;
  pageSize?: number | null;
}

const toNullablePage = (v: number | null | undefined): number | null =>
  v == null || !Number.isFinite(v) || v < 1 ? null : Math.floor(v);

const mapSingleRowToFrontend = (row: any) => {
  if (!row) return null;
  return {
    requestTypeId: row.REQUEST_TYPE_ID,
    requestTypeCode: row.REQUEST_TYPE_CODE,
    requestTypeName: row.REQUEST_TYPE_NAME,
    description: row.DESCRIPTION,
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

export const savePurchaseRequestTypeService = async (data: PurchaseRequestTypeData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("REQUEST_TYPE_CODE", sql.VarChar(20), data.REQUEST_TYPE_CODE || null)
      .input("REQUEST_TYPE_NAME", sql.VarChar(100), data.REQUEST_TYPE_NAME || null)
      .input("DESCRIPTION", sql.VarChar(500), data.DESCRIPTION || null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || "ACTIVE")
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMASTER.SAVE_PURCHASE_REQUEST_TYPE_MASTER");

    const { status, message, data: id } = parseSprocResult(
      result.recordset?.[0],
      "Failed to save purchase request type"
    );

    return { message: message || "Purchase Request Type saved successfully", id: Number(id) || null };
  } catch (error) {
    console.error("SAVE_PURCHASE_REQUEST_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const updatePurchaseRequestTypeService = async (data: PurchaseRequestTypeData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("REQUEST_TYPE_ID", sql.Int, data.REQUEST_TYPE_ID ?? 0)
      .input("REQUEST_TYPE_CODE", sql.VarChar(20), data.REQUEST_TYPE_CODE || null)
      .input("REQUEST_TYPE_NAME", sql.VarChar(100), data.REQUEST_TYPE_NAME || null)
      .input("DESCRIPTION", sql.VarChar(500), data.DESCRIPTION || null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMASTER.UPDATE_PURCHASE_REQUEST_TYPE_MASTER");

    const { status, message } = parseSprocResult(
      result.recordset?.[0],
      "Failed to update purchase request type"
    );

    return { message: message || "Purchase Request Type updated successfully" };
  } catch (error) {
    console.error("UPDATE_PURCHASE_REQUEST_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const deletePurchaseRequestTypeService = async (
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
      .input("REQUEST_TYPE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMASTER.DELETE_PURCHASE_REQUEST_TYPE_MASTER");

    const { status, message } = parseSprocResult(
      result.recordset?.[0],
      "Failed to delete purchase request type"
    );

    return { message: message || "Purchase Request Type deleted successfully" };
  } catch (error) {
    console.error("DELETE_PURCHASE_REQUEST_TYPE_MASTER SP error:", error);
    throw error;
  }
};

/**
 * List request types with optional server-side search/status filtering.
 * The SP returns "Total + page rows" (two result sets) when paging is
 * requested; it falls back to a single result-set when paging is off.
 */
export const getPurchaseRequestTypeListService = async (
  filter: PurchaseRequestTypeListFilter = {}
): Promise<{ total: number; rows: any[] }> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("REQUEST_TYPE_ID", sql.Int, null)
      .input("Status", sql.VarChar(20), filter.status || "ALL")
      .input("Search", sql.NVarChar(400), filter.search || null)
      .input("Page", sql.Int, toNullablePage(filter.page))
      .input("PageSize", sql.Int, toNullablePage(filter.pageSize))
      .execute("VMASTER.GET_PURCHASE_REQUEST_TYPE_MASTER");

    const recordsets = (result.recordsets || []) as any[][];
    if (recordsets.length >= 2) {
      const rows = recordsets[1] || [];
      const total = Number(recordsets[0]?.[0]?.Total ?? 0);
      return { total, rows };
    }
    const rows = recordsets[0] || [];
    return { total: rows.length, rows };
  } catch (error) {
    console.error("GET_PURCHASE_REQUEST_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const getPurchaseRequestTypeByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("REQUEST_TYPE_ID", sql.Int, id)
      .execute("VMASTER.GET_PURCHASE_REQUEST_TYPE_MASTER");

    return mapSingleRowToFrontend(result.recordset?.[0] || null);
  } catch (error) {
    console.error("GET_PURCHASE_REQUEST_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const loadPurchaseRequestTypeOptionsService = async (includeInactive = false) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("IncludeInactive", sql.Bit, includeInactive ? 1 : 0)
      .execute("VMASTER.LOAD_PURCHASE_REQUEST_TYPE_MASTER");

    return result.recordset || [];
  } catch (error) {
    console.error("LOAD_PURCHASE_REQUEST_TYPE_MASTER SP error:", error);
    throw error;
  }
};