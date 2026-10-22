import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface ApprovalStageDtlData {
  APPROVAL_STAGE_DTL_ID?: number;
  APPROVAL_STAGE_ID?: number;
  USER_ID?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

export interface ApprovalStageHdrData {
  APPROVAL_STAGE_ID?: number;
  APPROVAL_STAGE_NAME?: string;
  APPROVAL_STAGE_ORDER?: number;
  NO_OF_APPROVALS_REQUIRED?: number;
  NO_OF_REJECT_REQUIRED?: number;
  REMARKS?: string;
  LINK_PAGES_ID?: number | null;
  STATUS_MASTER?: string;
  dtls?: ApprovalStageDtlData[];
  deletedIds?: number[];
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const numOrNull = (v: any): number | null =>
  v === undefined || v === null || v === "" ? null : Number(v);

export const getAllApprovalStageHdrService = async (status = "ALL", searchText: string | null = null) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const listResult = await pool
      .request()
      .input("STATUS", sql.VarChar(20), status || "ALL")
      .input("SEARCH_TEXT", sql.VarChar(100), searchText || null)
      .execute("VApproval.LOAD_APPROVAL_STAGE_HDR");

    /* LOAD_APPROVAL_STAGE_HDR does not project LINK_PAGES_ID, so read the
       id -> link map separately for the grid's "Link Page" column. */
    const linkMapResult = await pool
      .request()
      .query("SELECT APPROVAL_STAGE_ID, LINK_PAGES_ID FROM [VApproval].[TBL_APPROVAL_STAGE_HDR]");

    const linkMap = new Map<number, number | null>();
    for (const r of linkMapResult.recordset || []) {
      linkMap.set(Number(r.APPROVAL_STAGE_ID), r.LINK_PAGES_ID == null ? null : Number(r.LINK_PAGES_ID));
    }

    return (listResult.recordset || []).map((h: any) => ({
      ...h,
      LINK_PAGES_ID: linkMap.get(Number(h.APPROVAL_STAGE_ID)) ?? null,
    }));
  } catch (error) {
    console.error("LOAD_APPROVAL_STAGE_HDR error:", error);
    throw error;
  }
};

export const getApprovalStageHdrService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("APPROVAL_STAGE_ID", sql.Int, id)
      .execute("VApproval.GET_APPROVAL_STAGE_HDR");

    const row = result.recordset?.[0] || null;
    if (!row) throw new Error("Approval stage not found");
    return row;
  } catch (error) {
    console.error("GET_APPROVAL_STAGE_HDR error:", error);
    throw error;
  }
};

export const getApprovalStageDtlByStageService = async (stageId: number, status = "A") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    /* SHOW_APPROVAL_STAGE_DTL only takes @STATUS, so scope to the stage here. */
    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(2), status || "A")
      .execute("VApproval.SHOW_APPROVAL_STAGE_DTL");

    return (result.recordset || []).filter(
      (r: any) => Number(r.APPROVAL_STAGE_ID) === Number(stageId)
    );
  } catch (error) {
    console.error("SHOW_APPROVAL_STAGE_DTL error:", error);
    throw error;
  }
};

export const getApprovalStageDtlService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("APPROVAL_STAGE_DTL_ID", sql.Int, id)
      .execute("VApproval.GET_APPROVAL_STAGE_DTL");

    const row = result.recordset?.[0] || null;
    if (!row) throw new Error("Approval stage detail not found");
    return row;
  } catch (error) {
    console.error("GET_APPROVAL_STAGE_DTL error:", error);
    throw error;
  }
};

/* Upserts one stage-user row. For rows without an id we first look up any
   existing row for the (stage, user) pair - including soft-deleted ones -
   so re-adding a previously removed user reactivates it instead of tripping
   the SP's duplicate-user guard. */
const upsertDtl = async (
  pool: sql.ConnectionPool,
  stageId: number,
  dtl: ApprovalStageDtlData,
  user: string,
  macAddress: string
) => {
  const userId = numOrNull(dtl.USER_ID);
  if (!userId) return;

  const remarks = dtl.REMARKS || null;
  const statusVal = dtl.STATUS_MASTER || "A";

  let dtlId = numOrNull(dtl.APPROVAL_STAGE_DTL_ID);

  if (!dtlId) {
    const existing = await pool
      .request()
      .input("APPROVAL_STAGE_ID", sql.Int, stageId)
      .input("USER_ID", sql.Int, userId)
      .query(
        "SELECT APPROVAL_STAGE_DTL_ID FROM [VApproval].[TBL_APPROVAL_STAGE_DTL] WHERE APPROVAL_STAGE_ID = @APPROVAL_STAGE_ID AND USER_ID = @USER_ID"
      );
    const found = existing.recordset?.[0]?.APPROVAL_STAGE_DTL_ID;
    dtlId = found != null ? Number(found) : null;
  }

  if (dtlId) {
    const result = await pool
      .request()
      .input("APPROVAL_STAGE_DTL_ID", sql.Int, dtlId)
      .input("APPROVAL_STAGE_ID", sql.Int, stageId)
      .input("USER_ID", sql.Int, userId)
      .input("REMARKS", sql.VarChar(1000), remarks)
      .input("STATUS_MASTER", sql.VarChar(2), statusVal)
      .input("USER", sql.VarChar(50), user)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VApproval.UPDATE_APPROVAL_STAGE_DTL");

    parseSprocResult(result.recordset?.[0], "Failed to update approval stage user");
  } else {
    const result = await pool
      .request()
      .input("APPROVAL_STAGE_ID", sql.Int, stageId)
      .input("USER_ID", sql.Int, userId)
      .input("REMARKS", sql.VarChar(1000), remarks)
      .input("STATUS_MASTER", sql.VarChar(2), statusVal)
      .input("USER", sql.VarChar(50), user)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VApproval.SAVE_APPROVAL_STAGE_DTL");

    parseSprocResult(result.recordset?.[0], "Failed to save approval stage user");
  }
};

export const saveApprovalStageHdrCombinedService = async (data: ApprovalStageHdrData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const user = data.USER || "Admin";
  const macAddress = data.MAC_ADDRESS || "WEB";

  try {
    const hdrResult = await pool
      .request()
      .input("APPROVAL_STAGE_NAME", sql.VarChar(100), data.APPROVAL_STAGE_NAME || null)
      .input("APPROVAL_STAGE_ORDER", sql.Int, numOrNull(data.APPROVAL_STAGE_ORDER))
      .input("NO_OF_APPROVALS_REQUIRED", sql.Int, numOrNull(data.NO_OF_APPROVALS_REQUIRED))
      .input("NO_OF_REJECT_REQUIRED", sql.Int, numOrNull(data.NO_OF_REJECT_REQUIRED))
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("LINK_PAGES_ID", sql.Int, numOrNull(data.LINK_PAGES_ID))
      .input("STATUS_MASTER", sql.VarChar(50), data.STATUS_MASTER || "ACTIVE")
      .input("USER", sql.VarChar(50), user)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VApproval.SAVE_APPROVAL_STAGE_HDR");

    const { data: hdrData } = parseSprocResult(hdrResult.recordset?.[0], "Failed to save approval stage");

    let hdrId = Number(hdrData) || 0;
    if (!hdrId) {
      const maxResult = await pool
        .request()
        .query("SELECT MAX(APPROVAL_STAGE_ID) AS MaxID FROM [VApproval].[TBL_APPROVAL_STAGE_HDR]");
      hdrId = Number(maxResult.recordset?.[0]?.MaxID) || 0;
    }
    if (!hdrId) throw new Error("Could not determine approval stage ID");

    const dtls = Array.isArray(data.dtls) ? data.dtls : [];
    for (const dtl of dtls) {
      await upsertDtl(pool, hdrId, dtl, user, macAddress);
    }

    return { message: "Approval stage saved successfully", APPROVAL_STAGE_ID: hdrId };
  } catch (error) {
    console.error("SAVE_APPROVAL_STAGE_HDR error:", error);
    throw error;
  }
};

export const updateApprovalStageHdrCombinedService = async (data: ApprovalStageHdrData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const stageId = numOrNull(data.APPROVAL_STAGE_ID);
  if (!stageId) throw new Error("Approval stage ID is required");

  const user = data.USER || "Admin";
  const macAddress = data.MAC_ADDRESS || "WEB";

  try {
    const hdrResult = await pool
      .request()
      .input("APPROVAL_STAGE_ID", sql.Int, stageId)
      .input("APPROVAL_STAGE_NAME", sql.VarChar(100), data.APPROVAL_STAGE_NAME || null)
      .input("APPROVAL_STAGE_ORDER", sql.Int, numOrNull(data.APPROVAL_STAGE_ORDER))
      .input("NO_OF_APPROVALS_REQUIRED", sql.Int, numOrNull(data.NO_OF_APPROVALS_REQUIRED))
      .input("NO_OF_REJECT_REQUIRED", sql.Int, numOrNull(data.NO_OF_REJECT_REQUIRED))
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("LINK_PAGES_ID", sql.Int, numOrNull(data.LINK_PAGES_ID))
      .input("STATUS_MASTER", sql.VarChar(50), data.STATUS_MASTER || "ACTIVE")
      .input("USER", sql.VarChar(50), user)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VApproval.UPDATE_APPROVAL_STAGE_HDR");

    parseSprocResult(hdrResult.recordset?.[0], "Failed to update approval stage");

    const dtls = Array.isArray(data.dtls) ? data.dtls : [];
    for (const dtl of dtls) {
      await upsertDtl(pool, stageId, dtl, user, macAddress);
    }

    const deletedIds = Array.isArray(data.deletedIds) ? data.deletedIds : [];
    for (const dtlId of deletedIds) {
      await deleteApprovalStageDtlService(Number(dtlId), user, macAddress);
    }

    return { message: "Approval stage updated successfully", APPROVAL_STAGE_ID: stageId };
  } catch (error) {
    console.error("UPDATE_APPROVAL_STAGE_HDR error:", error);
    throw error;
  }
};

export const saveApprovalStageDtlService = async (
  data: ApprovalStageDtlData,
  user = "Admin",
  macAddress = "WEB"
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("APPROVAL_STAGE_ID", sql.Int, numOrNull(data.APPROVAL_STAGE_ID))
      .input("USER_ID", sql.Int, numOrNull(data.USER_ID))
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(2), data.STATUS_MASTER || "A")
      .input("USER", sql.VarChar(50), user)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VApproval.SAVE_APPROVAL_STAGE_DTL");

    const { data: newId } = parseSprocResult(result.recordset?.[0], "Failed to save approval stage user");

    return { message: "Approval stage user saved successfully", APPROVAL_STAGE_DTL_ID: Number(newId) || 0 };
  } catch (error) {
    console.error("SAVE_APPROVAL_STAGE_DTL error:", error);
    throw error;
  }
};

export const updateApprovalStageDtlService = async (
  data: ApprovalStageDtlData,
  user = "Admin",
  macAddress = "WEB"
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("APPROVAL_STAGE_DTL_ID", sql.Int, numOrNull(data.APPROVAL_STAGE_DTL_ID))
      .input("APPROVAL_STAGE_ID", sql.Int, numOrNull(data.APPROVAL_STAGE_ID))
      .input("USER_ID", sql.Int, numOrNull(data.USER_ID))
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(2), data.STATUS_MASTER || "A")
      .input("USER", sql.VarChar(50), user)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VApproval.UPDATE_APPROVAL_STAGE_DTL");

    parseSprocResult(result.recordset?.[0], "Failed to update approval stage user");

    return { message: "Approval stage user updated successfully" };
  } catch (error) {
    console.error("UPDATE_APPROVAL_STAGE_DTL error:", error);
    throw error;
  }
};

export const deleteApprovalStageDtlService = async (
  id: number,
  user = "Admin",
  macAddress = "WEB"
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("APPROVAL_STAGE_DTL_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VApproval.DELETE_APPROVAL_STAGE_DTL");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to delete approval stage user");

    return { message: message || "Approval stage user deleted successfully" };
  } catch (error) {
    console.error("DELETE_APPROVAL_STAGE_DTL error:", error);
    throw error;
  }
};

export const deleteApprovalStageHdrService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("APPROVAL_STAGE_ID", sql.Int, id)
      .execute("VApproval.DELETE_APPROVAL_STAGE_HDR");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to delete approval stage");

    return { message: message || "Approval stage deleted successfully" };
  } catch (error) {
    console.error("DELETE_APPROVAL_STAGE_HDR error:", error);
    throw error;
  }
};
