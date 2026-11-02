import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

/**
 * TBL_LINKS_AND_PAGES row for /visa-type-master. Used as the default LINK_ID
 * when the caller does not send one (GET/SAVE/UPDATE require it).
 */
export const VISA_TYPE_MASTER_LINK_ID = 89;

export interface VisaTypeMasterData {
  VISA_TYPE_ID?: number;
  VISA_TYPE_NAME: string;
  VISA_VALIDITY_DAYS?: number;
  REMARKS?: string;
  STATUS_MASTER: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
  LINK_ID?: number | null;
}

export const toVisaTypeLinkId = (value: unknown): number => {
  if (value === undefined || value === null || value === "") {
    return VISA_TYPE_MASTER_LINK_ID;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : VISA_TYPE_MASTER_LINK_ID;
};

/**
 * SHOW_VISA_TYPE_MASTER only accepts one raw STATUS_MASTER value (AC/IN/IA)
 * and returns it translated to ACTIVE/INACTIVE.
 */
const showVisaTypes = async (status: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const result = await pool
    .request()
    .input("STATUS", sql.VarChar(20), status)
    .execute("VMaster.SHOW_VISA_TYPE_MASTER");

  return result.recordset || [];
};

export const getAllVisaTypeMasterService = async (status?: string) => {
  const wanted = String(status ?? "ALL").trim().toUpperCase();

  try {
    if (!wanted || wanted === "ALL") {
      const groups = await Promise.all(["AC", "IN", "IA"].map(showVisaTypes));
      const seen = new Set<number>();
      return groups.flat().filter((row: any) => {
        const id = Number(row.VISA_TYPE_ID);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    }

    if (wanted === "ACTIVE" || wanted === "AC") {
      return await showVisaTypes("AC");
    }

    if (wanted === "INACTIVE" || wanted === "IN" || wanted === "IA") {
      const groups = await Promise.all([showVisaTypes("IN"), showVisaTypes("IA")]);
      const seen = new Set<number>();
      return groups.flat().filter((row: any) => {
        const id = Number(row.VISA_TYPE_ID);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    }

    return await showVisaTypes(wanted);
  } catch (error) {
    console.error("SHOW_VISA_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const getVisaTypeMasterByIdService = async (id: number, linkId?: unknown) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("VISA_TYPE_ID", sql.Int, id)
      .input("link_id", sql.Int, toVisaTypeLinkId(linkId))
      .execute("VMaster.GET_VISA_TYPE_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_VISA_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const saveVisaTypeMasterService = async (data: VisaTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("VISA_TYPE_NAME", sql.VarChar(50), data.VISA_TYPE_NAME || null)
      .input("VISA_VALIDITY_DAYS", sql.Int, data.VISA_VALIDITY_DAYS ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .input("link_id", sql.Int, toVisaTypeLinkId(data.LINK_ID))
      .execute("VMaster.SAVE_VISA_TYPE_MASTER");

    const { message, data: savedId } = parseSprocResult(
      result.recordset?.[0],
      "Failed to save visa type"
    );

    return {
      message: message || "Visa type saved successfully",
      VISA_TYPE_ID:
        savedId !== undefined && savedId !== null && savedId !== ""
          ? Number(savedId)
          : undefined,
    };
  } catch (error) {
    console.error("SAVE_VISA_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const updateVisaTypeMasterService = async (data: VisaTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("VISA_TYPE_ID", sql.Int, data.VISA_TYPE_ID ?? 0)
      .input("VISA_TYPE_NAME", sql.VarChar(50), data.VISA_TYPE_NAME ?? null)
      .input("VISA_VALIDITY_DAYS", sql.Int, data.VISA_VALIDITY_DAYS ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .input("link_id", sql.Int, toVisaTypeLinkId(data.LINK_ID))
      .execute("VMaster.UPDATE_VISA_TYPE_MASTER");

    const { message } = parseSprocResult(
      result.recordset?.[0],
      "Failed to update visa type"
    );

    return { message: message || "Visa type updated successfully" };
  } catch (error) {
    console.error("UPDATE_VISA_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const deleteVisaTypeMasterService = async (
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
      .input("VISA_TYPE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_VISA_TYPE_MASTER");
    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete");
    return { message: message || "Visa type deleted successfully" };
  } catch (error) {
    console.error("DELETE_VISA_TYPE_MASTER SP error:", error);
    throw error;
  }
};
