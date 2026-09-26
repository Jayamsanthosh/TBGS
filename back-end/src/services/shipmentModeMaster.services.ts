import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface ShipmentModeMasterData {
  SHIPMENT_MODE_ID?: number;
  SHIPMENT_MODE_NAME: string;
  REMARKS?: string | null;
  STATUS_ENTRY?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export interface ShipmentModeMasterListFilter {
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
    shipmentModeId: row.SHIPMENT_MODE_ID,
    shipmentModeName: row.SHIPMENT_MODE_NAME,
    remarks: row.REMARKS,
    statusEntry: row.STATUS_ENTRY,
    createdBy: row.CREATED_BY,
    createdDate: row.CREATED_DATE,
    createdMacAddress: row.CREATED_MAC_ADDRESS,
    modifiedBy: row.MODIFIED_BY,
    modifiedDate: row.MODIFIED_DATE,
    modifiedMacAddress: row.MODIFIED_MAC_ADDRESS,
  };
};

export const saveShipmentModeMasterService = async (data: ShipmentModeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SHIPMENT_MODE_NAME", sql.VarChar(200), data.SHIPMENT_MODE_NAME || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_ENTRY", sql.VarChar(50), data.STATUS_ENTRY || "AC")
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMASTER.SAVE_SHIPMENT_MODE_MASTER");

    const { status, message, data: id } = parseSprocResult(
      result.recordset?.[0],
      "Failed to save shipment mode"
    );

    return { message: message || "Shipment Mode saved successfully", id: Number(id) || null };
  } catch (error) {
    console.error("SAVE_SHIPMENT_MODE_MASTER SP error:", error);
    throw error;
  }
};

export const updateShipmentModeMasterService = async (data: ShipmentModeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SHIPMENT_MODE_ID", sql.Int, data.SHIPMENT_MODE_ID ?? 0)
      .input("SHIPMENT_MODE_NAME", sql.VarChar(200), data.SHIPMENT_MODE_NAME || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_ENTRY", sql.VarChar(50), data.STATUS_ENTRY || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMASTER.UPDATE_SHIPMENT_MODE_MASTER");

    const { status, message } = parseSprocResult(
      result.recordset?.[0],
      "Failed to update shipment mode"
    );

    return { message: message || "Shipment Mode updated successfully" };
  } catch (error) {
    console.error("UPDATE_SHIPMENT_MODE_MASTER SP error:", error);
    throw error;
  }
};

export const deleteShipmentModeMasterService = async (
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
      .input("SHIPMENT_MODE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMASTER.DELETE_SHIPMENT_MODE_MASTER");

    const { status, message } = parseSprocResult(
      result.recordset?.[0],
      "Failed to delete shipment mode"
    );

    return { message: message || "Shipment Mode deleted successfully" };
  } catch (error) {
    console.error("DELETE_SHIPMENT_MODE_MASTER SP error:", error);
    throw error;
  }
};

/**
 * List shipment modes with optional server-side status/search filtering.
 * The SP returns "Total + page rows" (two result sets) when paging is
 * requested; it falls back to a single result-set when paging is off.
 */
export const getShipmentModeMasterListService = async (
  filter: ShipmentModeMasterListFilter = {}
): Promise<{ total: number; rows: any[] }> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SHIPMENT_MODE_ID", sql.Int, null)
      .input("Status", sql.VarChar(50), filter.status || "ALL")
      .input("Search", sql.NVarChar(200), filter.search || null)
      .input("Page", sql.Int, toNullablePage(filter.page))
      .input("PageSize", sql.Int, toNullablePage(filter.pageSize))
      .execute("VMASTER.GET_SHIPMENT_MODE_MASTER");

    const recordsets = (result.recordsets || []) as any[][];
    if (recordsets.length >= 2) {
      const rows = recordsets[1] || [];
      const total = Number(recordsets[0]?.[0]?.Total ?? 0);
      return { total, rows };
    }
    const rows = recordsets[0] || [];
    return { total: rows.length, rows };
  } catch (error) {
    console.error("GET_SHIPMENT_MODE_MASTER SP error:", error);
    throw error;
  }
};

export const getShipmentModeMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SHIPMENT_MODE_ID", sql.Int, id)
      .execute("VMASTER.GET_SHIPMENT_MODE_MASTER");

    return mapSingleRowToFrontend(result.recordset?.[0] || null);
  } catch (error) {
    console.error("GET_SHIPMENT_MODE_MASTER SP error:", error);
    throw error;
  }
};

export const loadShipmentModeMasterOptionsService = async (includeInactive = false) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("IncludeInactive", sql.Bit, includeInactive ? 1 : 0)
      .execute("VMASTER.LOAD_SHIPMENT_MODE_MASTER");

    return result.recordset || [];
  } catch (error) {
    console.error("LOAD_SHIPMENT_MODE_MASTER SP error:", error);
    throw error;
  }
};