import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface ApprovalTemplateRequesterDtlData {
  APPROVAL_TEMPLATE_REQ_DTL_ID?: number;
  APPROVAL_TEMPLATE_ID?: number;
  USER_ID?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

export interface ApprovalTemplateStageDtlData {
  APPROVAL_TEMPLATE_STAGE_DTL_ID?: number;
  APPROVAL_TEMPLATE_ID?: number;
  APPROVAL_STAGE_ID?: number;
  STAGE_ORDER?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

export interface ApprovalTemplateHdrData {
  APPROVAL_TEMPLATE_ID?: number;
  APPROVAL_TEMPLATE_NAME?: string;
  PAGE_LINK_ID?: number | null;
  LINK_PAGES_ID?: number | null;
  COMPANY_ID?: number | null;
  CAMP_ID?: number | null;
  STORE_ID?: number | null;
  AMOUNT_VALIDATION_STATUS?: string;
  MIN_AMOUNT?: number | string | null;
  MAX_AMOUNT?: number | string | null;
  EFFECTIVE_FROM?: string | null;
  EFFECTIVE_TO?: string | null;
  REMARKS?: string;
  STATUS_MASTER?: string;
  requesterDtls?: ApprovalTemplateRequesterDtlData[];
  stageDtls?: ApprovalTemplateStageDtlData[];
  deletedRequesterIds?: number[];
  deletedStageIds?: number[];
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const numOrNull = (v: any): number | null =>
  v === undefined || v === null || v === "" ? null : Number(v);

const textOrNull = (v: any): string | null =>
  v === undefined || v === null || String(v).trim() === "" ? null : String(v).trim();

/* ACCEPTED_INPUT_DATE_RE matches the shapes the API may receive:
   - HTML date input: "2026-10-15"
   - SP GET output (style 106, spaces replaced with '-'): "15-Oct-2026"
   - Full ISO / Date object stringified by JSON: "2026-10-15T00:00:00.000Z"
   Dates are built at UTC midnight because tedious serializes sql.Date from the
   UTC components; using local midnight would shift the day in non-UTC zones. */
const toSqlDate = (v: any): Date | null => {
  if (v === undefined || v === null || v === "") return null;

  if (v instanceof Date) {
    return Number.isNaN(v.getTime())
      ? null
      : new Date(Date.UTC(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate()));
  }

  const str = String(v).trim();

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
  if (iso) {
    const d = new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const styled = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/.exec(str);
  if (styled) {
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const mi = months.indexOf(String(styled[2]).toLowerCase());
    if (mi >= 0) {
      const d = new Date(Date.UTC(Number(styled[3]), mi, Number(styled[1])));
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }

  const fallback = new Date(str);
  if (Number.isNaN(fallback.getTime())) return null;
  return new Date(Date.UTC(fallback.getFullYear(), fallback.getMonth(), fallback.getDate()));
};

/* GET_APPROVAL_TEMPLATE_HDR selects its two EFFECTIVE_* dates without an
   alias, so node-mssql collapses both into a single anonymous key holding an
   array [EFFECTIVE_FROM, EFFECTIVE_TO]. Restore them under real names. */
const normalizeHdrDates = (row: any): any => {
  if (!row) return row;
  const dates = row[""];
  if (Array.isArray(dates) && dates.length >= 2) {
    const { [""]: _drop, ...rest } = row;
    return { ...rest, EFFECTIVE_FROM: dates[0] ?? null, EFFECTIVE_TO: dates[1] ?? null };
  }
  return row;
};

export const getAllApprovalTemplateHdrService = async (
  status = "ALL",
  searchText: string | null = null,
  pageLinkId: number | null = null,
  companyId: number | null = null,
  campId: number | null = null,
  storeId: number | null = null
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const listResult = await pool
      .request()
      .input("STATUS", sql.VarChar(20), status || "ALL")
      .input("SEARCH_TEXT", sql.VarChar(100), textOrNull(searchText))
      .input("PAGE_LINK_ID", sql.Int, pageLinkId)
      .input("COMPANY_ID", sql.Int, companyId)
      .input("CAMP_ID", sql.Int, campId)
      .input("STORE_ID", sql.Int, storeId)
      .execute("VApproval.LOAD_APPROVAL_TEMPLATE_HDR");

    /* LOAD_APPROVAL_TEMPLATE_HDR projects PAGE_LINK_ID but not the
       ownership LINK_PAGES_ID the SHOW join uses, so read the id -> link map
       separately for the grid's "Link Page" column. */
    const linkMapResult = await pool
      .request()
      .query("SELECT APPROVAL_TEMPLATE_ID, LINK_PAGES_ID FROM [VApproval].[TBL_APPROVAL_TEMPLATE_HDR]");

    const linkMap = new Map<number, number | null>();
    for (const r of linkMapResult.recordset || []) {
      linkMap.set(
        Number(r.APPROVAL_TEMPLATE_ID),
        r.LINK_PAGES_ID == null ? null : Number(r.LINK_PAGES_ID)
      );
    }

    return (listResult.recordset || []).map((h: any) => ({
      ...h,
      LINK_PAGES_ID: linkMap.get(Number(h.APPROVAL_TEMPLATE_ID)) ?? null,
    }));
  } catch (error) {
    console.error("LOAD_APPROVAL_TEMPLATE_HDR error:", error);
    throw error;
  }
};

export const getApprovalTemplateHdrService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("APPROVAL_TEMPLATE_ID", sql.Int, id)
      .execute("VApproval.GET_APPROVAL_TEMPLATE_HDR");

    const row = normalizeHdrDates(result.recordset?.[0] || null);
    if (!row) throw new Error("Approval template not found");
    return row;
  } catch (error) {
    console.error("GET_APPROVAL_TEMPLATE_HDR error:", error);
    throw error;
  }
};

export const getRequesterDtlsByTemplateService = async (
  templateId: number,
  status = "ALL"
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(50), status || "ALL")
      .input("APPROVAL_TEMPLATE_ID", sql.Int, templateId)
      .input("SEARCH_TEXT", sql.VarChar(100), null)
      .execute("VApproval.LOAD_APPROVAL_TEMPLATE_REQUESTER_DTL");

    return result.recordset || [];
  } catch (error) {
    console.error("LOAD_APPROVAL_TEMPLATE_REQUESTER_DTL error:", error);
    throw error;
  }
};

export const getStageDtlsByTemplateService = async (
  templateId: number,
  status = "ALL",
  approvalStageId: number | null = null
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(50), status || "ALL")
      .input("APPROVAL_TEMPLATE_ID", sql.Int, templateId)
      .input("APPROVAL_STAGE_ID", sql.Int, approvalStageId)
      .input("SEARCH_TEXT", sql.VarChar(100), null)
      .execute("VApproval.LOAD_APPROVAL_TEMPLATE_STAGE_DTL");

    return result.recordset || [];
  } catch (error) {
    console.error("LOAD_APPROVAL_TEMPLATE_STAGE_DTL error:", error);
    throw error;
  }
};

/* Upserts one requester row. For rows without an id we first look up any
   existing row for the (template, user) pair so re-adding a previously removed
   user updates that row instead of tripping the SP's duplicate-user guard. */
const upsertRequesterDtl = async (
  pool: sql.ConnectionPool,
  templateId: number,
  dtl: ApprovalTemplateRequesterDtlData,
  user: string,
  macAddress: string
) => {
  const userId = numOrNull(dtl.USER_ID);
  if (!userId) return;

  const remarks = textOrNull(dtl.REMARKS);
  const statusVal = dtl.STATUS_MASTER || "ACTIVE";

  let dtlId = numOrNull(dtl.APPROVAL_TEMPLATE_REQ_DTL_ID);

  if (!dtlId) {
    const existing = await pool
      .request()
      .input("APPROVAL_TEMPLATE_ID", sql.Int, templateId)
      .input("USER_ID", sql.Int, userId)
      .query(
        "SELECT APPROVAL_TEMPLATE_REQ_DTL_ID FROM [VApproval].[TBL_APPROVAL_TEMPLATE_REQUESTER_DTL] WHERE APPROVAL_TEMPLATE_ID = @APPROVAL_TEMPLATE_ID AND USER_ID = @USER_ID"
      );
    const found = existing.recordset?.[0]?.APPROVAL_TEMPLATE_REQ_DTL_ID;
    dtlId = found != null ? Number(found) : null;
  }

  if (dtlId) {
    const result = await pool
      .request()
      .input("APPROVAL_TEMPLATE_REQ_DTL_ID", sql.Int, dtlId)
      .input("APPROVAL_TEMPLATE_ID", sql.Int, templateId)
      .input("USER_ID", sql.Int, userId)
      .input("REMARKS", sql.VarChar(100), remarks)
      .input("STATUS_MASTER", sql.VarChar(50), statusVal)
      .input("USER", sql.VarChar(50), user)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VApproval.UPDATE_APPROVAL_TEMPLATE_REQUESTER_DTL");

    parseSprocResult(result.recordset?.[0], "Failed to update approval template requester");
  } else {
    const result = await pool
      .request()
      .input("APPROVAL_TEMPLATE_ID", sql.Int, templateId)
      .input("USER_ID", sql.Int, userId)
      .input("REMARKS", sql.VarChar(100), remarks)
      .input("STATUS_MASTER", sql.VarChar(50), statusVal)
      .input("USER", sql.VarChar(50), user)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VApproval.SAVE_APPROVAL_TEMPLATE_REQUESTER_DTL");

    parseSprocResult(result.recordset?.[0], "Failed to save approval template requester");
  }
};

/* Upserts one stage row. Duplicate checks are on (template, stage) and
   (template, stage order) inside the SP; we only resolve the id for new rows. */
const upsertStageDtl = async (
  pool: sql.ConnectionPool,
  templateId: number,
  dtl: ApprovalTemplateStageDtlData,
  user: string,
  macAddress: string
) => {
  const stageId = numOrNull(dtl.APPROVAL_STAGE_ID);
  if (!stageId) return;

  const order = numOrNull(dtl.STAGE_ORDER);
  if (order === null) throw new Error("Stage Order is required");

  const remarks = textOrNull(dtl.REMARKS);
  const statusVal = dtl.STATUS_MASTER || "ACTIVE";

  let dtlId = numOrNull(dtl.APPROVAL_TEMPLATE_STAGE_DTL_ID);

  if (!dtlId) {
    const existing = await pool
      .request()
      .input("APPROVAL_TEMPLATE_ID", sql.Int, templateId)
      .input("APPROVAL_STAGE_ID", sql.Int, stageId)
      .query(
        "SELECT APPROVAL_TEMPLATE_STAGE_DTL_ID FROM [VApproval].[TBL_APPROVAL_TEMPLATE_STAGE_DTL] WHERE APPROVAL_TEMPLATE_ID = @APPROVAL_TEMPLATE_ID AND APPROVAL_STAGE_ID = @APPROVAL_STAGE_ID"
      );
    const found = existing.recordset?.[0]?.APPROVAL_TEMPLATE_STAGE_DTL_ID;
    dtlId = found != null ? Number(found) : null;
  }

  if (dtlId) {
    const result = await pool
      .request()
      .input("APPROVAL_TEMPLATE_STAGE_DTL_ID", sql.Int, dtlId)
      .input("APPROVAL_TEMPLATE_ID", sql.Int, templateId)
      .input("APPROVAL_STAGE_ID", sql.Int, stageId)
      .input("STAGE_ORDER", sql.Int, order)
      .input("REMARKS", sql.VarChar(100), remarks)
      .input("STATUS_MASTER", sql.VarChar(50), statusVal)
      .input("USER", sql.VarChar(50), user)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VApproval.UPDATE_APPROVAL_TEMPLATE_STAGE_DTL");

    parseSprocResult(result.recordset?.[0], "Failed to update approval template stage");
  } else {
    const result = await pool
      .request()
      .input("APPROVAL_TEMPLATE_ID", sql.Int, templateId)
      .input("APPROVAL_STAGE_ID", sql.Int, stageId)
      .input("STAGE_ORDER", sql.Int, order)
      .input("REMARKS", sql.VarChar(100), remarks)
      .input("STATUS_MASTER", sql.VarChar(50), statusVal)
      .input("USER", sql.VarChar(50), user)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VApproval.SAVE_APPROVAL_TEMPLATE_STAGE_DTL");

    parseSprocResult(result.recordset?.[0], "Failed to save approval template stage");
  }
};

const runHdrSave = (
  pool: sql.ConnectionPool,
  data: ApprovalTemplateHdrData,
  user: string,
  macAddress: string
) => {
  const pageLinkId = numOrNull(data.PAGE_LINK_ID);

  return pool
    .request()
    .input("APPROVAL_TEMPLATE_NAME", sql.VarChar(100), textOrNull(data.APPROVAL_TEMPLATE_NAME))
    .input("PAGE_LINK_ID", sql.Int, pageLinkId)
    .input("COMPANY_ID", sql.Int, numOrNull(data.COMPANY_ID))
    .input("CAMP_ID", sql.Int, numOrNull(data.CAMP_ID))
    .input("STORE_ID", sql.Int, numOrNull(data.STORE_ID))
    .input("AMOUNT_VALIDATION_STATUS", sql.VarChar(10), textOrNull(data.AMOUNT_VALIDATION_STATUS))
    .input("MIN_AMOUNT", sql.Decimal(19, 4), numOrNull(data.MIN_AMOUNT))
    .input("MAX_AMOUNT", sql.Decimal(19, 4), numOrNull(data.MAX_AMOUNT))
    .input("EFFECTIVE_FROM", sql.Date, toSqlDate(data.EFFECTIVE_FROM))
    .input("EFFECTIVE_TO", sql.Date, toSqlDate(data.EFFECTIVE_TO))
    .input("REMARKS", sql.VarChar(100), textOrNull(data.REMARKS))
    /* LINK_PAGES_ID mirrors PAGE_LINK_ID so SHOW's link join and the grid's
       Link Page column agree with the selected page. */
    .input("LINK_PAGES_ID", sql.Int, pageLinkId)
    .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || "ACTIVE")
    .input("USER", sql.VarChar(50), user)
    .input("MAC_ADDRESS", sql.VarChar(50), macAddress);
};

export const saveApprovalTemplateHdrCombinedService = async (data: ApprovalTemplateHdrData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const user = data.USER || "Admin";
  const macAddress = data.MAC_ADDRESS || "WEB";

  try {
    const hdrResult = await runHdrSave(pool, data, user, macAddress).execute(
      "VApproval.SAVE_APPROVAL_TEMPLATE_HDR"
    );

    const { data: hdrData } = parseSprocResult(
      hdrResult.recordset?.[0],
      "Failed to save approval template"
    );

    let hdrId = Number(hdrData) || 0;
    if (!hdrId) {
      const maxResult = await pool
        .request()
        .query("SELECT MAX(APPROVAL_TEMPLATE_ID) AS MaxID FROM [VApproval].[TBL_APPROVAL_TEMPLATE_HDR]");
      hdrId = Number(maxResult.recordset?.[0]?.MaxID) || 0;
    }
    if (!hdrId) throw new Error("Could not determine approval template ID");

    const requesterDtls = Array.isArray(data.requesterDtls) ? data.requesterDtls : [];
    for (const dtl of requesterDtls) {
      await upsertRequesterDtl(pool, hdrId, dtl, user, macAddress);
    }

    const stageDtls = Array.isArray(data.stageDtls) ? data.stageDtls : [];
    for (const dtl of stageDtls) {
      await upsertStageDtl(pool, hdrId, dtl, user, macAddress);
    }

    return { message: "Approval template saved successfully", APPROVAL_TEMPLATE_ID: hdrId };
  } catch (error) {
    console.error("SAVE_APPROVAL_TEMPLATE_HDR error:", error);
    throw error;
  }
};

export const updateApprovalTemplateHdrCombinedService = async (data: ApprovalTemplateHdrData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const templateId = numOrNull(data.APPROVAL_TEMPLATE_ID);
  if (!templateId) throw new Error("Approval Template ID is required");

  const user = data.USER || "Admin";
  const macAddress = data.MAC_ADDRESS || "WEB";

  try {
    const hdrResult = await runHdrSave(pool, data, user, macAddress)
      .input("APPROVAL_TEMPLATE_ID", sql.Int, templateId)
      .execute("VApproval.UPDATE_APPROVAL_TEMPLATE_HDR");

    parseSprocResult(hdrResult.recordset?.[0], "Failed to update approval template");

    const requesterDtls = Array.isArray(data.requesterDtls) ? data.requesterDtls : [];
    for (const dtl of requesterDtls) {
      await upsertRequesterDtl(pool, templateId, dtl, user, macAddress);
    }

    const stageDtls = Array.isArray(data.stageDtls) ? data.stageDtls : [];
    for (const dtl of stageDtls) {
      await upsertStageDtl(pool, templateId, dtl, user, macAddress);
    }

    const deletedRequesterIds = Array.isArray(data.deletedRequesterIds) ? data.deletedRequesterIds : [];
    for (const dtlId of deletedRequesterIds) {
      await deleteApprovalTemplateRequesterDtlService(Number(dtlId), user, macAddress);
    }

    const deletedStageIds = Array.isArray(data.deletedStageIds) ? data.deletedStageIds : [];
    for (const dtlId of deletedStageIds) {
      await deleteApprovalTemplateStageDtlService(Number(dtlId), user, macAddress);
    }

    return { message: "Approval template updated successfully", APPROVAL_TEMPLATE_ID: templateId };
  } catch (error) {
    console.error("UPDATE_APPROVAL_TEMPLATE_HDR error:", error);
    throw error;
  }
};

export const saveApprovalTemplateRequesterDtlService = async (
  data: ApprovalTemplateRequesterDtlData,
  user = "Admin",
  macAddress = "WEB"
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("APPROVAL_TEMPLATE_ID", sql.Int, numOrNull(data.APPROVAL_TEMPLATE_ID))
      .input("USER_ID", sql.Int, numOrNull(data.USER_ID))
      .input("REMARKS", sql.VarChar(100), textOrNull(data.REMARKS))
      .input("STATUS_MASTER", sql.VarChar(50), data.STATUS_MASTER || "ACTIVE")
      .input("USER", sql.VarChar(50), user)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VApproval.SAVE_APPROVAL_TEMPLATE_REQUESTER_DTL");

    const { message, data: newId } = parseSprocResult(
      result.recordset?.[0],
      "Failed to save approval template requester"
    );

    return {
      message: message || "Approval template requester saved successfully",
      APPROVAL_TEMPLATE_REQ_DTL_ID: Number(newId) || 0,
    };
  } catch (error) {
    console.error("SAVE_APPROVAL_TEMPLATE_REQUESTER_DTL error:", error);
    throw error;
  }
};

export const updateApprovalTemplateRequesterDtlService = async (
  data: ApprovalTemplateRequesterDtlData,
  user = "Admin",
  macAddress = "WEB"
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("APPROVAL_TEMPLATE_REQ_DTL_ID", sql.Int, numOrNull(data.APPROVAL_TEMPLATE_REQ_DTL_ID))
      .input("APPROVAL_TEMPLATE_ID", sql.Int, numOrNull(data.APPROVAL_TEMPLATE_ID))
      .input("USER_ID", sql.Int, numOrNull(data.USER_ID))
      .input("REMARKS", sql.VarChar(100), textOrNull(data.REMARKS))
      .input("STATUS_MASTER", sql.VarChar(50), data.STATUS_MASTER || "ACTIVE")
      .input("USER", sql.VarChar(50), user)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VApproval.UPDATE_APPROVAL_TEMPLATE_REQUESTER_DTL");

    const { message } = parseSprocResult(
      result.recordset?.[0],
      "Failed to update approval template requester"
    );

    return { message: message || "Approval template requester updated successfully" };
  } catch (error) {
    console.error("UPDATE_APPROVAL_TEMPLATE_REQUESTER_DTL error:", error);
    throw error;
  }
};

export const deleteApprovalTemplateRequesterDtlService = async (
  id: number,
  user = "Admin",
  macAddress = "WEB"
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("APPROVAL_TEMPLATE_REQ_DTL_ID", sql.Int, id)
      .execute("VApproval.DELETE_APPROVAL_TEMPLATE_REQUESTER_DTL");

    const { message } = parseSprocResult(
      result.recordset?.[0],
      "Failed to delete approval template requester"
    );

    return { message: message || "Approval template requester deleted successfully" };
  } catch (error) {
    console.error("DELETE_APPROVAL_TEMPLATE_REQUESTER_DTL error:", error);
    throw error;
  }
};

export const saveApprovalTemplateStageDtlService = async (
  data: ApprovalTemplateStageDtlData,
  user = "Admin",
  macAddress = "WEB"
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("APPROVAL_TEMPLATE_ID", sql.Int, numOrNull(data.APPROVAL_TEMPLATE_ID))
      .input("APPROVAL_STAGE_ID", sql.Int, numOrNull(data.APPROVAL_STAGE_ID))
      .input("STAGE_ORDER", sql.Int, numOrNull(data.STAGE_ORDER))
      .input("REMARKS", sql.VarChar(100), textOrNull(data.REMARKS))
      .input("STATUS_MASTER", sql.VarChar(50), data.STATUS_MASTER || "ACTIVE")
      .input("USER", sql.VarChar(50), user)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VApproval.SAVE_APPROVAL_TEMPLATE_STAGE_DTL");

    const { message, data: newId } = parseSprocResult(
      result.recordset?.[0],
      "Failed to save approval template stage"
    );

    return {
      message: message || "Approval template stage saved successfully",
      APPROVAL_TEMPLATE_STAGE_DTL_ID: Number(newId) || 0,
    };
  } catch (error) {
    console.error("SAVE_APPROVAL_TEMPLATE_STAGE_DTL error:", error);
    throw error;
  }
};

export const updateApprovalTemplateStageDtlService = async (
  data: ApprovalTemplateStageDtlData,
  user = "Admin",
  macAddress = "WEB"
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("APPROVAL_TEMPLATE_STAGE_DTL_ID", sql.Int, numOrNull(data.APPROVAL_TEMPLATE_STAGE_DTL_ID))
      .input("APPROVAL_TEMPLATE_ID", sql.Int, numOrNull(data.APPROVAL_TEMPLATE_ID))
      .input("APPROVAL_STAGE_ID", sql.Int, numOrNull(data.APPROVAL_STAGE_ID))
      .input("STAGE_ORDER", sql.Int, numOrNull(data.STAGE_ORDER))
      .input("REMARKS", sql.VarChar(100), textOrNull(data.REMARKS))
      .input("STATUS_MASTER", sql.VarChar(50), data.STATUS_MASTER || "ACTIVE")
      .input("USER", sql.VarChar(50), user)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VApproval.UPDATE_APPROVAL_TEMPLATE_STAGE_DTL");

    const { message } = parseSprocResult(
      result.recordset?.[0],
      "Failed to update approval template stage"
    );

    return { message: message || "Approval template stage updated successfully" };
  } catch (error) {
    console.error("UPDATE_APPROVAL_TEMPLATE_STAGE_DTL error:", error);
    throw error;
  }
};

export const deleteApprovalTemplateStageDtlService = async (
  id: number,
  user = "Admin",
  macAddress = "WEB"
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("APPROVAL_TEMPLATE_STAGE_DTL_ID", sql.Int, id)
      .execute("VApproval.DELETE_APPROVAL_TEMPLATE_STAGE_DTL");

    const { message } = parseSprocResult(
      result.recordset?.[0],
      "Failed to delete approval template stage"
    );

    return { message: message || "Approval template stage deleted successfully" };
  } catch (error) {
    console.error("DELETE_APPROVAL_TEMPLATE_STAGE_DTL error:", error);
    throw error;
  }
};

export const deleteApprovalTemplateHdrService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    /* The two DTL tables reference this HDR with NO_ACTION foreign keys and
       their DELETE sprocs are physical, so child rows must be removed first or
       DELETE_APPROVAL_TEMPLATE_HDR fails with a foreign-key violation. */
    const requesterIds = await pool
      .request()
      .input("APPROVAL_TEMPLATE_ID", sql.Int, id)
      .query(
        "SELECT APPROVAL_TEMPLATE_REQ_DTL_ID FROM [VApproval].[TBL_APPROVAL_TEMPLATE_REQUESTER_DTL] WHERE APPROVAL_TEMPLATE_ID = @APPROVAL_TEMPLATE_ID"
      );
    for (const r of requesterIds.recordset || []) {
      await deleteApprovalTemplateRequesterDtlService(Number(r.APPROVAL_TEMPLATE_REQ_DTL_ID));
    }

    const stageIds = await pool
      .request()
      .input("APPROVAL_TEMPLATE_ID", sql.Int, id)
      .query(
        "SELECT APPROVAL_TEMPLATE_STAGE_DTL_ID FROM [VApproval].[TBL_APPROVAL_TEMPLATE_STAGE_DTL] WHERE APPROVAL_TEMPLATE_ID = @APPROVAL_TEMPLATE_ID"
      );
    for (const r of stageIds.recordset || []) {
      await deleteApprovalTemplateStageDtlService(Number(r.APPROVAL_TEMPLATE_STAGE_DTL_ID));
    }

    const result = await pool
      .request()
      .input("APPROVAL_TEMPLATE_ID", sql.Int, id)
      .execute("VApproval.DELETE_APPROVAL_TEMPLATE_HDR");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to delete approval template");

    return { message: message || "Approval template deleted successfully" };
  } catch (error) {
    console.error("DELETE_APPROVAL_TEMPLATE_HDR error:", error);
    throw error;
  }
};
