import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface ParticipantTypeMasterData {
  PARTICIPANT_TYPE_ID?: number;
  PARTICIPANT_TYPE_NAME: string;
  PARTICIPANT_TYPE_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
  LINK_ID?: number | null;
}

const toInt = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

const serializeRecordset = (rows: any[]) =>
  (rows || []).map((r: any) => ({ ...r, id: r.PARTICIPANT_TYPE_ID, LINK_ID: r.LINK_ID ?? 243 }));

export const getAllParticipantTypeMasterService = async (status = "ALL") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    if (status === "ALL" || !status) {
      const statuses = ["AC", "IA"];
      let allRows: any[] = [];
      for (const s of statuses) {
        const result = await pool
          .request()
          .input("STATUS", sql.VarChar(50), s)
          .execute("VMaster.SHOW_PARTICIPANT_TYPE_MASTER");
        allRows = allRows.concat(result.recordset || []);
      }
      return serializeRecordset(allRows);
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(50), status)
      .execute("VMaster.SHOW_PARTICIPANT_TYPE_MASTER");
    return serializeRecordset(result.recordset || []);
  } catch (error) {
    console.error("SHOW_PARTICIPANT_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const getParticipantTypeMasterByIdService = async (id: number, linkId?: number | null) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const resolvedLinkId = toInt(linkId) ?? 243;

  try {
    const result = await pool
      .request()
      .input("PARTICIPANT_TYPE_ID", sql.Int, id)
      .input("LINK_ID", sql.Int, resolvedLinkId)
      .execute("VMaster.GET_PARTICIPANT_TYPE_MASTER");

    if (result.recordset?.[0]) {
      return { ...result.recordset[0], LINK_ID: resolvedLinkId };
    }

    // Fallback if record exists with different/null link_id
    const fallback = await pool
      .request()
      .input("PARTICIPANT_TYPE_ID", sql.Int, id)
      .query(`SELECT * FROM VMaster.TBL_PARTICIPANT_TYPE_MASTER WHERE PARTICIPANT_TYPE_ID = @PARTICIPANT_TYPE_ID`);
    const fallbackRow = fallback.recordset[0] || null;
    return fallbackRow ? { ...fallbackRow, LINK_ID: resolvedLinkId } : null;
  } catch (error) {
    console.error("GET_PARTICIPANT_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const saveParticipantTypeMasterService = async (data: ParticipantTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PARTICIPANT_TYPE_ID", sql.Int, toInt(data.PARTICIPANT_TYPE_ID) ?? 0)
      .input("PARTICIPANT_TYPE_NAME", sql.VarChar(50), data.PARTICIPANT_TYPE_NAME || null)
      .input("PARTICIPANT_TYPE_DESCRIPTION", sql.VarChar(50), data.PARTICIPANT_TYPE_DESCRIPTION || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || "AC")
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_PARTICIPANT_TYPE_MASTER");

    const { message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save participant type");

    let newId = toInt(savedData) || toInt(data.PARTICIPANT_TYPE_ID);
    if (!newId || newId === 0) {
      const idRes = await pool
        .request()
        .input("PARTICIPANT_TYPE_NAME", sql.VarChar(50), data.PARTICIPANT_TYPE_NAME)
        .query(
          `SELECT TOP 1 PARTICIPANT_TYPE_ID FROM VMaster.TBL_PARTICIPANT_TYPE_MASTER WHERE PARTICIPANT_TYPE_NAME = @PARTICIPANT_TYPE_NAME ORDER BY PARTICIPANT_TYPE_ID DESC`
        );
      newId = idRes.recordset?.[0]?.PARTICIPANT_TYPE_ID;
    }

    const resolvedLinkId = toInt(data.LINK_ID) ?? 243;
    if (newId) {
      await pool
        .request()
        .input("LINK_ID", sql.Int, resolvedLinkId)
        .input("PARTICIPANT_TYPE_ID", sql.Int, newId)
        .query(
          `UPDATE VMaster.TBL_PARTICIPANT_TYPE_MASTER SET LINK_ID = @LINK_ID WHERE PARTICIPANT_TYPE_ID = @PARTICIPANT_TYPE_ID AND (LINK_ID IS NULL OR LINK_ID = 0)`
        );
    }

    return {
      message: message || "Data Saved Successfully",
      PARTICIPANT_TYPE_ID: newId,
    };
  } catch (error) {
    console.error("SAVE_PARTICIPANT_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const updateParticipantTypeMasterService = async (data: ParticipantTypeMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PARTICIPANT_TYPE_ID", sql.Int, toInt(data.PARTICIPANT_TYPE_ID) ?? 0)
      .input("PARTICIPANT_TYPE_NAME", sql.VarChar(50), data.PARTICIPANT_TYPE_NAME ?? null)
      .input("PARTICIPANT_TYPE_DESCRIPTION", sql.VarChar(50), data.PARTICIPANT_TYPE_DESCRIPTION ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? "AC")
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .input("LINK_ID", sql.Int, toInt(data.LINK_ID) ?? 243)
      .execute("VMaster.UPDATE_PARTICIPANT_TYPE_MASTER");

    const { message, data: updatedId } = parseSprocResult(result.recordset?.[0], "Failed to update participant type");

    return {
      message: message || "Data Updated Successfully",
      PARTICIPANT_TYPE_ID: toInt(updatedId) || toInt(data.PARTICIPANT_TYPE_ID),
    };
  } catch (error) {
    console.error("UPDATE_PARTICIPANT_TYPE_MASTER SP error:", error);
    throw error;
  }
};

export const deleteParticipantTypeMasterService = async (
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
      .input("PARTICIPANT_TYPE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_PARTICIPANT_TYPE_MASTER");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to delete participant type");
    return { message: message || "Data Deleted Successfully" };
  } catch (error) {
    const msg = (error as any)?.message || "";
    if (msg.includes("REFERENCE constraint") || msg.includes("FK_")) {
      throw new Error("Cannot delete: This participant type has associated records.");
    }
    console.error("DELETE_PARTICIPANT_TYPE_MASTER SP error:", error);
    throw error;
  }
};