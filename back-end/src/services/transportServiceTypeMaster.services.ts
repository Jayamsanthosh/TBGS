import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

/**
 * TBL_LINKS_AND_PAGES row for /transport-service-type-master. Used as the
 * default LINK_ID when the caller does not send one (SAVE/UPDATE require it).
 */
export const TRANSPORT_SERVICE_TYPE_MASTER_LINK_ID = 288;

export interface TransportServiceTypeMasterData {
  TRANSPORT_SERVICE_TYPE_ID?: number;
  TRANSPORT_SERVICE_TYPE_NAME: string;
  DESCRIPTION?: string | null;
  REMARKS?: string | null;
  STATUS_MASTER?: string | null;
  USER?: string | null;
  MAC_ADDRESS?: string | null;
  ROLE?: string | null;
  LINK_ID?: number | null;
}

const errorWithStatus = (message: string, httpStatus: number) => {
  const error = new Error(message) as Error & { httpStatus?: number };
  error.httpStatus = httpStatus;
  return error;
};

/* TBL_TRANSPORT_SERVICE_TYPE_MASTER.LINK_ID carries
   FK_LINK_ID_TBL_TRANSPORT_SERVICE_TYPE_MASTER -> TBL_LINKS_AND_PAGES. */
const rethrowWriteError = (error: any): never => {
  if (error?.number === 547) throw errorWithStatus("Invalid LINK_ID", 400);
  throw error;
};

export const toTransportServiceTypeLinkId = (value: unknown): number => {
  if (value === undefined || value === null || value === "") {
    return TRANSPORT_SERVICE_TYPE_MASTER_LINK_ID;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : TRANSPORT_SERVICE_TYPE_MASTER_LINK_ID;
};

/**
 * SHOW_TRANSPORT_SERVICE_TYPE_MASTER natively understands
 * '' / NULL / 'ALL', exact STATUS_MASTER matches and the ACTIVE<->AC /
 * INACTIVE<->IN aliases, so a single call covers every filter.
 */
const showTransportServiceTypes = async (status: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const result = await pool
    .request()
    .input("STATUS", sql.VarChar(10), status)
    .execute("VMaster.SHOW_TRANSPORT_SERVICE_TYPE_MASTER");

  return result.recordset || [];
};

export const getAllTransportServiceTypeMasterService = async (status?: string) => {
  const wanted = String(status ?? "ALL").trim().toUpperCase();

  try {
    if (!wanted || wanted === "ALL") {
      return await showTransportServiceTypes("ALL");
    }

    if (wanted === "ACTIVE" || wanted === "AC") {
      return await showTransportServiceTypes("AC");
    }

    if (wanted === "INACTIVE" || wanted === "IA" || wanted === "IN") {
      /* Rows can be stored as 'IA' by this app or as 'INACTIVE'/'IN' by older
         data; the proc maps 'IN' to STATUS_MASTER = 'INACTIVE' only, so run
         both spellings and merge. */
      const [ia, inactive] = await Promise.all([
        showTransportServiceTypes("IA"),
        showTransportServiceTypes("IN"),
      ]);

      const seen = new Set<number>();
      return [...ia, ...inactive].filter((row: any) => {
        const id = Number(row.TRANSPORT_SERVICE_TYPE_ID);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    }

    return await showTransportServiceTypes(wanted);
  } catch (error) {
    console.error("SHOW_TRANSPORT_SERVICE_TYPE_MASTER SP error:", error);
    throw error;
  }
};

/** GET_TRANSPORT_SERVICE_TYPE_MASTER only declares @TRANSPORT_SERVICE_TYPE_ID. */
export const getTransportServiceTypeMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("TRANSPORT_SERVICE_TYPE_ID", sql.Int, id)
      .execute("VMaster.GET_TRANSPORT_SERVICE_TYPE_MASTER");

    return result.recordset?.[0] || null;
  } catch (error) {
    console.error("GET_TRANSPORT_SERVICE_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const saveTransportServiceTypeMasterService = async (
  data: TransportServiceTypeMasterData
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("TRANSPORT_SERVICE_TYPE_ID", sql.Int, data.TRANSPORT_SERVICE_TYPE_ID ?? 0)
      .input("TRANSPORT_SERVICE_TYPE_NAME", sql.VarChar(100), data.TRANSPORT_SERVICE_TYPE_NAME ?? null)
      .input("DESCRIPTION", sql.VarChar(500), data.DESCRIPTION || null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || "AC")
      .input("LINK_ID", sql.Int, toTransportServiceTypeLinkId(data.LINK_ID))
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_TRANSPORT_SERVICE_TYPE_MASTER");

    const { message, data: savedId } = parseSprocResult(
      result.recordset?.[0],
      "Failed to save transport service type"
    );

    return {
      message: message || "Transport service type saved successfully",
      TRANSPORT_SERVICE_TYPE_ID:
        savedId !== undefined && savedId !== null && savedId !== ""
          ? Number(savedId)
          : undefined,
    };
  } catch (error) {
    console.error("SAVE_TRANSPORT_SERVICE_TYPE_MASTER SP error:", error);
    throw rethrowWriteError(error);
  }
};

export const updateTransportServiceTypeMasterService = async (
  data: TransportServiceTypeMasterData
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const id = Number(data.TRANSPORT_SERVICE_TYPE_ID);
  if (!Number.isFinite(id) || id <= 0) {
    throw errorWithStatus("Transport Service Type ID is required", 400);
  }

  try {
    /* UPDATE has no existence check - it always reports
       "Data Updated Successfully" even when the WHERE matched nothing. */
    const current = await getTransportServiceTypeMasterByIdService(id);
    if (!current) throw errorWithStatus("Transport service type not found", 404);

    const result = await pool
      .request()
      .input("TRANSPORT_SERVICE_TYPE_ID", sql.Int, id)
      .input("TRANSPORT_SERVICE_TYPE_NAME", sql.VarChar(100), data.TRANSPORT_SERVICE_TYPE_NAME ?? null)
      .input("DESCRIPTION", sql.VarChar(500), data.DESCRIPTION || null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || "AC")
      .input("LINK_ID", sql.Int, toTransportServiceTypeLinkId(data.LINK_ID))
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.UPDATE_TRANSPORT_SERVICE_TYPE_MASTER");

    const { message } = parseSprocResult(
      result.recordset?.[0],
      "Failed to update transport service type"
    );

    return { message: message || "Transport service type updated successfully" };
  } catch (error) {
    console.error("UPDATE_TRANSPORT_SERVICE_TYPE_MASTER SP error:", error);
    throw rethrowWriteError(error);
  }
};

export const deleteTransportServiceTypeMasterService = async (
  id: number,
  user: string,
  role: string,
  macAddress: string
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    /* DELETE has no existence check and only gates on an exact 'Admin' role,
       so the API reports a missing row as 404 itself. */
    const current = await getTransportServiceTypeMasterByIdService(id);
    if (!current) throw errorWithStatus("Transport service type not found", 404);

    const result = await pool
      .request()
      .input("TRANSPORT_SERVICE_TYPE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_TRANSPORT_SERVICE_TYPE_MASTER");

    const { message } = parseSprocResult(
      result.recordset?.[0],
      "No rights to delete transport service type"
    );

    return { message: message || "Transport service type deleted successfully" };
  } catch (error) {
    console.error("DELETE_TRANSPORT_SERVICE_TYPE_MASTER SP error:", error);
    throw error;
  }
};
