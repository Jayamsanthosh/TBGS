import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

/* Column widths taken from VMaster/NPayEntries INFORMATION_SCHEMA, not guessed.
   TBL_PURCHASE_QUOTATION_CONVERSATION_DTL:
     PURCHASE_QUOTATION_NO 50, RESPONSE_EMP_ID int, DISCUSSION_DETAILS MAX,
     RESPONSE_STATUS 50, STATUS_ENTRY 50, REMARKS 50, audit varchar(50). */
const MAX_LEN = {
  PURCHASE_QUOTATION_NO: 50,
  RESPONSE_STATUS: 50,
  STATUS_ENTRY: 50,
  REMARKS: 50,
  USER: 50,
  ROLE: 50,
  MAC_ADDRESS: 50,
} as const;

/* The column is VARCHAR(MAX), so this is a sanity cap rather than a schema one. */
const MAX_DISCUSSION = 10000;

export interface ConversationIdentity {
  USER?: string;
  ROLE?: string;
  MAC_ADDRESS?: string;
}

export interface PurchaseQuotationConversationData {
  PURCHASE_QUOTATION_NO?: string | null;
  RESPONSE_EMP_ID?: number | string | null;
  DISCUSSION_DETAILS?: string | null;
  RESPONSE_STATUS?: string | null;
  STATUS_ENTRY?: string | null;
  REMARKS?: string | null;
  USER?: string | null;
  MAC_ADDRESS?: string | null;
}

const text = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s === "" ? null : s;
};

const badRequest = (message: string) => {
  const err: any = new Error(message);
  err.httpStatus = 400;
  return err;
};

const tooLarge = (message: string) => {
  const err: any = new Error(message);
  err.httpStatus = 413;
  return err;
};

const notFound = (message: string) => {
  const err: any = new Error(message);
  err.httpStatus = 404;
  return err;
};

const fit = (value: unknown, column: keyof typeof MAX_LEN): string | null => {
  const s = text(value);
  if (s === null) return null;
  if (s.length > MAX_LEN[column]) {
    throw badRequest(`${column} must be ${MAX_LEN[column]} characters or less`);
  }
  return s;
};

const toInt = (value: unknown, label: string): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw badRequest(`${label} must be a positive whole number`);
  }
  return n;
};

const positiveSno = (value: unknown): number => {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw badRequest("A valid conversation SNO is required");
  }
  return n;
};

const discussion = (value: unknown): string | null => {
  const s = text(value);
  if (s === null) return null;
  if (s.length > MAX_DISCUSSION) {
    throw tooLarge(`Discussion details must be ${MAX_DISCUSSION} characters or less`);
  }
  return s;
};

const pool = () => {
  const p = getPool();
  if (!p) throw new Error("Database not connected");
  return p;
};

/* SHOW returns the joined employee name; the identifiers are kept too so the UI
   can fall back to the employee master. */
const shapeRow = (row: any) => ({
  ...row,
  id: row.ID ?? row.SNO,
});

export const getPurchaseQuotationConversationsService = async (
  purchaseQuotationNo: string,
  statusEntry?: string
) => {
  const refNo = fit(purchaseQuotationNo, "PURCHASE_QUOTATION_NO");
  if (refNo === null) throw badRequest("Purchase Quotation No is required");

  const status = fit(statusEntry, "STATUS_ENTRY");

  try {
    const result = await pool()
      .request()
      .input("PURCHASE_QUOTATION_NO", sql.VarChar(MAX_LEN.PURCHASE_QUOTATION_NO), refNo)
      .input("STATUS_ENTRY", sql.VarChar(MAX_LEN.STATUS_ENTRY), status)
      .execute("VPurchase.SHOW_PURCHASE_QUOTATION_CONVERSATION_DTL");

    return (result.recordset || []).map(shapeRow);
  } catch (error) {
    console.error("SHOW_PURCHASE_QUOTATION_CONVERSATION_DTL SP error:", error);
    throw error;
  }
};

export const getPurchaseQuotationConversationService = async (sno: number | string) => {
  const id = positiveSno(sno);

  try {
    const result = await pool()
      .request()
      .input("SNO", sql.Int, id)
      .execute("VPurchase.GET_PURCHASE_QUOTATION_CONVERSATION_DTL");

    const parsed = parseSprocResult(result.recordset?.[0], "Purchase Quotation Conversation not found.");
    if (!parsed) return null;
    return shapeRow(result.recordset?.[0]);
  } catch (error: any) {
    /* An unknown SNO is a missing resource, not a bad request. */
    if (/not found/i.test(error?.message ?? "")) throw notFound(error.message);
    console.error("GET_PURCHASE_QUOTATION_CONVERSATION_DTL SP error:", error);
    throw error;
  }
};

/* No response-status master exists, so the UI is fed whatever is in use. */
export const getConversationResponseStatusesService = async () => {
  const result = await pool().request().query(
    `SELECT DISTINCT LTRIM(RTRIM(RESPONSE_STATUS)) AS RESPONSE_STATUS
     FROM [VPurchase].[TBL_PURCHASE_QUOTATION_CONVERSATION_DTL]
     WHERE RESPONSE_STATUS IS NOT NULL AND LTRIM(RTRIM(RESPONSE_STATUS)) <> ''
     ORDER BY RESPONSE_STATUS`
  );

  return (result.recordset || [])
    .map((row: any) => row.RESPONSE_STATUS)
    .filter((v: unknown): v is string => typeof v === "string" && v !== "");
};

export const savePurchaseQuotationConversationService = async (
  data: PurchaseQuotationConversationData
) => {
  const purchaseQuotationNo = fit(data.PURCHASE_QUOTATION_NO, "PURCHASE_QUOTATION_NO");
  if (purchaseQuotationNo === null) {
    throw badRequest("Purchase Quotation No is required");
  }
  const responseEmpId = toInt(data.RESPONSE_EMP_ID, "Response Employee");

  const result = await pool()
    .request()
    .input("PURCHASE_QUOTATION_NO", sql.VarChar(MAX_LEN.PURCHASE_QUOTATION_NO), purchaseQuotationNo)
    .input("RESPONSE_EMP_ID", sql.Int, responseEmpId)
    .input("DISCUSSION_DETAILS", sql.VarChar(MAX_DISCUSSION), discussion(data.DISCUSSION_DETAILS))
    .input("RESPONSE_STATUS", sql.VarChar(MAX_LEN.RESPONSE_STATUS), fit(data.RESPONSE_STATUS, "RESPONSE_STATUS"))
    .input("STATUS_ENTRY", sql.VarChar(MAX_LEN.STATUS_ENTRY), fit(data.STATUS_ENTRY, "STATUS_ENTRY"))
    .input("REMARKS", sql.VarChar(MAX_LEN.REMARKS), fit(data.REMARKS, "REMARKS"))
    .input("USER", sql.VarChar(MAX_LEN.USER), fit(data.USER, "USER"))
    .input("MAC_ADDRESS", sql.VarChar(MAX_LEN.MAC_ADDRESS), fit(data.MAC_ADDRESS, "MAC_ADDRESS"))
    .execute("VPurchase.SAVE_PURCHASE_QUOTATION_CONVERSATION_DTL");

  const parsed = parseSprocResult(result.recordset?.[0], "Failed to save the conversation");
  return { SNO: Number(parsed?.data ?? 0), message: parsed?.message };
};

export const updatePurchaseQuotationConversationService = async (
  sno: number | string,
  data: PurchaseQuotationConversationData
) => {
  const id = positiveSno(sno);
  const purchaseQuotationNo = fit(data.PURCHASE_QUOTATION_NO, "PURCHASE_QUOTATION_NO");
  if (purchaseQuotationNo === null) {
    throw badRequest("Purchase Quotation No is required");
  }
  const responseEmpId = toInt(data.RESPONSE_EMP_ID, "Response Employee");

  const result = await pool()
    .request()
    .input("SNO", sql.Int, id)
    .input("PURCHASE_QUOTATION_NO", sql.VarChar(MAX_LEN.PURCHASE_QUOTATION_NO), purchaseQuotationNo)
    .input("RESPONSE_EMP_ID", sql.Int, responseEmpId)
    .input("DISCUSSION_DETAILS", sql.VarChar(MAX_DISCUSSION), discussion(data.DISCUSSION_DETAILS))
    .input("RESPONSE_STATUS", sql.VarChar(MAX_LEN.RESPONSE_STATUS), fit(data.RESPONSE_STATUS, "RESPONSE_STATUS"))
    .input("STATUS_ENTRY", sql.VarChar(MAX_LEN.STATUS_ENTRY), fit(data.STATUS_ENTRY, "STATUS_ENTRY"))
    .input("REMARKS", sql.VarChar(MAX_LEN.REMARKS), fit(data.REMARKS, "REMARKS"))
    .input("USER", sql.VarChar(MAX_LEN.USER), fit(data.USER, "USER"))
    .input("MAC_ADDRESS", sql.VarChar(MAX_LEN.MAC_ADDRESS), fit(data.MAC_ADDRESS, "MAC_ADDRESS"))
    .execute("VPurchase.UPDATE_PURCHASE_QUOTATION_CONVERSATION_DTL");

  const parsed = parseSprocResult(result.recordset?.[0], "Failed to update the conversation");
  return { SNO: Number(parsed?.data ?? id), message: parsed?.message };
};

export const deletePurchaseQuotationConversationService = async (
  sno: number | string,
  identity: ConversationIdentity
) => {
  const id = positiveSno(sno);

  /* The role is taken from the session and passed through as-is. It must never
     be defaulted to Admin, because a missing role would then delete anything. */
  const role = fit(identity.ROLE, "ROLE");

  const result = await pool()
    .request()
    .input("SNO", sql.Int, id)
    .input("USER", sql.VarChar(MAX_LEN.USER), fit(identity.USER, "USER"))
    .input("ROLE", sql.VarChar(MAX_LEN.ROLE), role)
    .input("MAC_ADDRESS", sql.VarChar(MAX_LEN.MAC_ADDRESS), fit(identity.MAC_ADDRESS, "MAC_ADDRESS"))
    .execute("VPurchase.DELETE_PURCHASE_QUOTATION_CONVERSATION_DTL");

  const parsed = parseSprocResult(result.recordset?.[0], "No Rights To Delete");
  return { SNO: Number(parsed?.data ?? id), message: parsed?.message };
};

export const conversationFieldLimits = { ...MAX_LEN, DISCUSSION_DETAILS: MAX_DISCUSSION };
