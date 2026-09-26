import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface AdditionalChargeTypeData {
  ADDITIONAL_CHARGE_TYPE_ID?: number;
  ADDITIONAL_CHARGE_TYPE_CODE: string;
  ADDITIONAL_CHARGE_TYPE_NAME: string;
  DESCRIPTION?: string | null;
  SORT_ORDER?: number | null;
  REMARKS?: string | null;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export interface AdditionalChargeTypeListFilter {
  status?: string | null;
  search?: string | null;
  page?: number | null;
  pageSize?: number | null;
}

const toNullablePage = (v: number | null | undefined): number | null =>
  v == null || !Number.isFinite(v) || v < 1 ? null : Math.floor(v);

/** NULL (not 0) for the nullable SORT_ORDER, otherwise 0 would be stored. */
const toNullableInt = (v: any): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

/**
 * GET_..._MASTER is dual-mode:
 *   @ID supplied -> single raw row (SELECT *)
 *   @ID NULL     -> paged/searched report with camelCase aliases
 * The single-row shape is normalised to the camelCase contract the frontend uses.
 */
const mapSingleRowToFrontend = (row: any) => {
  if (!row) return null;
  return {
    additionalChargeTypeId: row.ADDITIONAL_CHARGE_TYPE_ID,
    additionalChargeTypeCode: row.ADDITIONAL_CHARGE_TYPE_CODE,
    additionalChargeTypeName: row.ADDITIONAL_CHARGE_TYPE_NAME,
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

export const saveAdditionalChargeTypeService = async (data: AdditionalChargeTypeData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("ADDITIONAL_CHARGE_TYPE_CODE", sql.VarChar(30), data.ADDITIONAL_CHARGE_TYPE_CODE || null)
      .input("ADDITIONAL_CHARGE_TYPE_NAME", sql.VarChar(100), data.ADDITIONAL_CHARGE_TYPE_NAME || null)
      .input("DESCRIPTION", sql.VarChar(500), data.DESCRIPTION || null)
      .input("SORT_ORDER", sql.Int, toNullableInt(data.SORT_ORDER))
      .input("REMARKS", sql.VarChar(100), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || "ACTIVE")
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMASTER.SAVE_ADDITIONAL_CHARGE_TYPE_MASTER");

    const { message, data: id } = parseSprocResult(
      result.recordset?.[0],
      "Failed to save additional charge type"
    );

    return { message: message || "Additional Charge Type saved successfully", id: Number(id) || null };
  } catch (error) {
    console.error("SAVE_ADDITIONAL_CHARGE_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const updateAdditionalChargeTypeService = async (data: AdditionalChargeTypeData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("ADDITIONAL_CHARGE_TYPE_ID", sql.Int, data.ADDITIONAL_CHARGE_TYPE_ID ?? 0)
      .input("ADDITIONAL_CHARGE_TYPE_CODE", sql.VarChar(30), data.ADDITIONAL_CHARGE_TYPE_CODE || null)
      .input("ADDITIONAL_CHARGE_TYPE_NAME", sql.VarChar(100), data.ADDITIONAL_CHARGE_TYPE_NAME || null)
      .input("DESCRIPTION", sql.VarChar(500), data.DESCRIPTION || null)
      .input("SORT_ORDER", sql.Int, toNullableInt(data.SORT_ORDER))
      .input("REMARKS", sql.VarChar(100), data.REMARKS || null)
      // Never send NULL: UPDATE assigns STATUS_MASTER directly, so a NULL would
      // blank the flag and hide the record from LOAD_ (which filters ACTIVE).
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || "ACTIVE")
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMASTER.UPDATE_ADDITIONAL_CHARGE_TYPE_MASTER");

    const { message } = parseSprocResult(
      result.recordset?.[0],
      "Failed to update additional charge type"
    );

    return { message: message || "Additional Charge Type updated successfully" };
  } catch (error) {
    console.error("UPDATE_ADDITIONAL_CHARGE_TYPE_MASTER SP error:", error);
    throw error;
  }
};

/**
 * DELETE is guarded by the SP twice:
 *   1. @ROLE must be 'Admin'
 *   2. the charge type must not be referenced by
 *      VPurchase.TBL_PURCHASE_QUOTATION_ADDITIONAL_CHARGES_DTL
 * Both messages are surfaced to the caller through parseSprocResult.
 */
export const deleteAdditionalChargeTypeService = async (
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
      .input("ADDITIONAL_CHARGE_TYPE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMASTER.DELETE_ADDITIONAL_CHARGE_TYPE_MASTER");

    const { message } = parseSprocResult(
      result.recordset?.[0],
      "Failed to delete additional charge type"
    );

    return { message: message || "Additional Charge Type deleted successfully" };
  } catch (error) {
    console.error("DELETE_ADDITIONAL_CHARGE_TYPE_MASTER SP error:", error);
    throw error;
  }
};

/**
 * List with server-side search/status filtering.
 * Paging is requested => two result sets (COUNT + page); otherwise one.
 */
export const getAdditionalChargeTypeListService = async (
  filter: AdditionalChargeTypeListFilter = {}
): Promise<{ total: number; rows: any[] }> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("ADDITIONAL_CHARGE_TYPE_ID", sql.Int, null)
      .input("Status", sql.VarChar(20), filter.status || "ALL")
      .input("Search", sql.NVarChar(400), filter.search || null)
      .input("Page", sql.Int, toNullablePage(filter.page))
      .input("PageSize", sql.Int, toNullablePage(filter.pageSize))
      .execute("VMASTER.GET_ADDITIONAL_CHARGE_TYPE_MASTER");

    const recordsets = (result.recordsets || []) as any[][];
    if (recordsets.length >= 2) {
      const rows = recordsets[1] || [];
      const total = Number(recordsets[0]?.[0]?.Total ?? 0);
      return { total, rows };
    }
    const rows = recordsets[0] || [];
    return { total: rows.length, rows };
  } catch (error) {
    console.error("GET_ADDITIONAL_CHARGE_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const getAdditionalChargeTypeByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("ADDITIONAL_CHARGE_TYPE_ID", sql.Int, id)
      .execute("VMASTER.GET_ADDITIONAL_CHARGE_TYPE_MASTER");

    return mapSingleRowToFrontend(result.recordset?.[0] || null);
  } catch (error) {
    console.error("GET_ADDITIONAL_CHARGE_TYPE_MASTER SP error:", error);
    throw error;
  }
};

/** Dropdown options (ACTIVE only unless includeInactive=true). */
export const loadAdditionalChargeTypeOptionsService = async (includeInactive = false) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("IncludeInactive", sql.Bit, includeInactive ? 1 : 0)
      .execute("VMASTER.LOAD_ADDITIONAL_CHARGE_TYPE_MASTER");

    return result.recordset || [];
  } catch (error) {
    console.error("LOAD_ADDITIONAL_CHARGE_TYPE_MASTER SP error:", error);
    throw error;
  }
};
