import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

/**
 * TBL_LINKS_AND_PAGES row for /guide-master. Used as the default LINK_ID when
 * the caller does not send one (SAVE/UPDATE_GUIDE_MASTER require @LINK_ID).
 */
export const GUIDE_MASTER_LINK_ID = 287;

export interface GuideMasterData {
  GUIDE_ID?: number;
  GUIDE_NAME: string;
  GUIDE_DESCRIPTION?: string | null;
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

/* TBL_GUIDE_MASTER.LINK_ID carries FK_LINK_ID_TBL_GUIDE_MASTER -> TBL_LINKS_AND_PAGES. */
const rethrowWriteError = (error: any): never => {
  if (error?.number === 547) throw errorWithStatus("Invalid LINK_ID", 400);
  throw error;
};

export const toGuideLinkId = (value: unknown): number => {
  if (value === undefined || value === null || value === "") return GUIDE_MASTER_LINK_ID;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : GUIDE_MASTER_LINK_ID;
};

/**
 * SHOW_GUIDE_MASTER filters with `WHERE STATUS_MASTER = @STATUS` (exact match,
 * no 'ALL' support and no prefix mapping), so a list request has to be issued
 * once per stored status value.
 */
const showGuideMasterByStatus = async (status: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const result = await pool
    .request()
    .input("STATUS", sql.VarChar(50), status)
    .execute("VMaster.SHOW_GUIDE_MASTER");

  return result.recordset || [];
};

export const getAllGuideMasterService = async (status?: string) => {
  const wanted = String(status ?? "ALL").trim().toUpperCase();

  try {
    if (!wanted || wanted === "ALL") {
      const [active, inactive] = await Promise.all([
        showGuideMasterByStatus("AC"),
        showGuideMasterByStatus("IA"),
      ]);

      const seen = new Set<number>();
      return [...active, ...inactive].filter((row: any) => {
        const id = Number(row.GUIDE_ID);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    }

    const normalized =
      wanted === "ACTIVE" ? "AC" : wanted === "INACTIVE" || wanted === "IN" ? "IA" : wanted;

    return await showGuideMasterByStatus(normalized);
  } catch (error) {
    console.error("SHOW_GUIDE_MASTER SP error:", error);
    throw error;
  }
};

/** GET_GUIDE_MASTER only declares @GUIDE_ID (no LINK_ID filter). */
export const getGuideMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("GUIDE_ID", sql.Int, id)
      .execute("VMaster.GET_GUIDE_MASTER");

    return result.recordset?.[0] || null;
  } catch (error) {
    console.error("GET_GUIDE_MASTER SP error:", error);
    throw error;
  }
};

export const saveGuideMasterService = async (data: GuideMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("GUIDE_ID", sql.Int, data.GUIDE_ID ?? 0)
      .input("GUIDE_NAME", sql.VarChar(50), data.GUIDE_NAME ?? null)
      .input("GUIDE_DESCRIPTION", sql.VarChar(50), data.GUIDE_DESCRIPTION || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || "AC")
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .input("LINK_ID", sql.Int, toGuideLinkId(data.LINK_ID))
      .execute("VMaster.SAVE_GUIDE_MASTER");

    const { message, data: savedId } = parseSprocResult(
      result.recordset?.[0],
      "Failed to save guide"
    );

    return {
      message: message || "Guide saved successfully",
      GUIDE_ID:
        savedId !== undefined && savedId !== null && savedId !== ""
          ? Number(savedId)
          : undefined,
    };
  } catch (error) {
    console.error("SAVE_GUIDE_MASTER SP error:", error);
    throw rethrowWriteError(error);
  }
};

export const updateGuideMasterService = async (data: GuideMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const id = Number(data.GUIDE_ID);
  if (!Number.isFinite(id) || id <= 0) {
    throw errorWithStatus("Guide ID is required", 400);
  }

  try {
    /* UPDATE_GUIDE_MASTER has no existence check - it always reports
       "Data Updated Successfully" even when the WHERE matched nothing. */
    const current = await getGuideMasterByIdService(id);
    if (!current) throw errorWithStatus("Guide not found", 404);

    const result = await pool
      .request()
      .input("GUIDE_ID", sql.Int, id)
      .input("GUIDE_NAME", sql.VarChar(50), data.GUIDE_NAME ?? null)
      .input("GUIDE_DESCRIPTION", sql.VarChar(50), data.GUIDE_DESCRIPTION || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || "AC")
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .input("LINK_ID", sql.Int, toGuideLinkId(data.LINK_ID))
      .execute("VMaster.UPDATE_GUIDE_MASTER");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to update guide");

    return { message: message || "Guide updated successfully" };
  } catch (error) {
    console.error("UPDATE_GUIDE_MASTER SP error:", error);
    throw rethrowWriteError(error);
  }
};

export const deleteGuideMasterService = async (
  id: number,
  user: string,
  role: string,
  macAddress: string
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    /* DELETE_GUIDE_MASTER has no existence check and only gates on an exact
       'Admin' role, so the API reports a missing row as 404 itself. */
    const current = await getGuideMasterByIdService(id);
    if (!current) throw errorWithStatus("Guide not found", 404);

    const result = await pool
      .request()
      .input("GUIDE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_GUIDE_MASTER");

    const { message } = parseSprocResult(result.recordset?.[0], "No rights to delete");

    return { message: message || "Guide deleted successfully" };
  } catch (error) {
    console.error("DELETE_GUIDE_MASTER SP error:", error);
    throw error;
  }
};
