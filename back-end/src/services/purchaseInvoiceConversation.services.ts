import sql from "mssql";
import { getPool } from "../config/db";

/* The conversation thread lives in the shared table the approval flow already
   uses for Purchase Request and Purchase Quotation:
     [VMASTER].[TBL_TRANSACTION_APPROVAL_CONVERSATION_DTL]
   One row per reply, the owning page in LINK_PAGES_ID and the document
   reference in PAGE_REF_NO, so every page only ever reads its own rows.

   Column widths taken from INFORMATION_SCHEMA, not guessed:
     PAGE_REF_NO 50, RESPONSE_STATUS 50, REMARKS 500, STATUS_ENTRY 20,
     audit columns 50, DISCUSSION_DETAILS MAX. */
const MAX_LEN = {
  PAGE_REF_NO: 50,
  RESPONSE_STATUS: 50,
  STATUS_ENTRY: 20,
  REMARKS: 500,
  USER: 50,
  ROLE: 50,
  MAC_ADDRESS: 50,
} as const;

/* The column is VARCHAR(MAX), so this is a sanity cap rather than a schema one. */
const MAX_DISCUSSION = 10000;

/* VMaster.TBL_LINKS_AND_PAGES: 286 = Purchase Invoice. It is the fallback when
   a caller does not send one; the page always sends the id it resolved from
   the navigation so the two can never drift apart silently. */
export const PURCHASE_INVOICE_LINK_PAGES_ID = 286;

export interface ConversationIdentity {
  USER?: string;
  ROLE?: string;
  MAC_ADDRESS?: string;
}

export interface PurchaseInvoiceConversationData {
  PAGE_REF_NO?: string | null;
  LINK_PAGES_ID?: number | string | null;
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

const notFound = (message: string) => {
  const err: any = new Error(message);
  err.httpStatus = 404;
  return err;
};

const forbidden = (message: string) => {
  const err: any = new Error(message);
  err.httpStatus = 403;
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

const positiveId = (value: unknown): number => {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw badRequest("A valid conversation id is required");
  }
  return n;
};

const linkPagesIdOf = (value: unknown): number => {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return PURCHASE_INVOICE_LINK_PAGES_ID;
  return n;
};

const discussion = (value: unknown): string | null => {
  const s = text(value);
  if (s === null) return null;
  if (s.length > MAX_DISCUSSION) {
    throw badRequest(`Discussion details must be ${MAX_DISCUSSION} characters or less`);
  }
  return s;
};

const pool = () => {
  const p = getPool();
  if (!p) throw new Error("Database not connected");
  return p;
};

/* The table has a foreign key to NEW_EMPLOYEE_DATABASE, so an employee id
   that does not exist is refused by the server. It is checked here so the
   caller gets a readable message instead of a constraint violation. */
const assertEmployeeExists = async (empId: number | null) => {
  if (empId === null) return;
  const result = await pool()
    .request()
    .input("EMP_ID", sql.Int, empId)
    .query("SELECT 1 AS FOUND FROM [VPayEntries].[NEW_EMPLOYEE_DATABASE] WHERE EMP_ID = @EMP_ID");
  if (!result.recordset?.length) {
    throw badRequest("Response Employee does not exist");
  }
};

/* The employee name is three columns, and CONCAT treats a NULL part as empty,
   so no ISNULL is needed. EMP_ID is the join target, so the join cannot
   multiply rows. NULLIF is not used here because it is a reserved word in SQL
   Server and cannot be used as a function without brackets. */
const SELECT_COLUMNS = `
SELECT
    C.CONVERSATION_ID AS ID,
    C.CONVERSATION_ID,
    C.LINK_PAGES_ID,
    C.PAGE_REF_NO,
    C.RESPONSE_EMP_ID,
    LTRIM(RTRIM(CONCAT(E.FIRST_NAME, ' ', E.MIDDLE_NAME, ' ', E.LAST_NAME))) AS RESPONSE_EMP_NAME,
    C.DISCUSSION_DETAILS,
    C.RESPONSE_STATUS,
    CONVERT(VARCHAR(30), C.RESPONSE_DATE, 120) AS RESPONSE_DATE,
    C.REMARKS,
    C.STATUS_ENTRY,
    CONVERT(VARCHAR(30), C.CREATED_DATE, 120) AS CREATED_DATE,
    CONVERT(VARCHAR(30), C.MODIFIED_DATE, 120) AS MODIFIED_DATE,
    C.CREATED_BY,
    C.CREATED_MAC_ADDRESS,
    C.MODIFIED_BY,
    C.MODIFIED_MAC_ADDRESS
FROM [VMASTER].[TBL_TRANSACTION_APPROVAL_CONVERSATION_DTL] C
LEFT JOIN [VPayEntries].[NEW_EMPLOYEE_DATABASE] E ON E.EMP_ID = C.RESPONSE_EMP_ID`;

export const getPurchaseInvoiceConversationsService = async (
  refNo: string,
  statusEntry?: string,
  linkPagesId?: number | string | null
) => {
  const pageRefNo = fit(refNo, "PAGE_REF_NO");
  if (pageRefNo === null) throw badRequest("Purchase Invoice Ref No is required");
  const status = fit(statusEntry, "STATUS_ENTRY");

  const result = await pool()
    .request()
    .input("PAGE_REF_NO", sql.VarChar(MAX_LEN.PAGE_REF_NO), pageRefNo)
    .input("LINK_PAGES_ID", sql.Int, linkPagesIdOf(linkPagesId))
    .input("STATUS_ENTRY", sql.VarChar(MAX_LEN.STATUS_ENTRY), status)
    .query(`${SELECT_COLUMNS}
WHERE C.PAGE_REF_NO = @PAGE_REF_NO
  AND C.LINK_PAGES_ID = @LINK_PAGES_ID
  AND (@STATUS_ENTRY IS NULL OR LTRIM(RTRIM(@STATUS_ENTRY)) = '' OR C.STATUS_ENTRY = @STATUS_ENTRY)
ORDER BY C.CONVERSATION_ID ASC`);

  return result.recordset || [];
};

export const getPurchaseInvoiceConversationService = async (
  id: number | string,
  linkPagesId?: number | string | null
) => {
  const conversationId = positiveId(id);

  const result = await pool()
    .request()
    .input("CONVERSATION_ID", sql.Int, conversationId)
    .input("LINK_PAGES_ID", sql.Int, linkPagesIdOf(linkPagesId))
    .query(`${SELECT_COLUMNS}
WHERE C.CONVERSATION_ID = @CONVERSATION_ID
  AND C.LINK_PAGES_ID = @LINK_PAGES_ID`);

  const row = result.recordset?.[0];
  if (!row) throw notFound("Purchase Invoice Conversation not found");
  return row;
};

/* There is no response-status master, so the picker is fed whatever this page
   has already collected. */
export const getInvoiceConversationResponseStatusesService = async (
  linkPagesId?: number | string | null
) => {
  const result = await pool()
    .request()
    .input("LINK_PAGES_ID", sql.Int, linkPagesIdOf(linkPagesId))
    .query(
      `SELECT DISTINCT LTRIM(RTRIM(RESPONSE_STATUS)) AS RESPONSE_STATUS
       FROM [VMASTER].[TBL_TRANSACTION_APPROVAL_CONVERSATION_DTL]
       WHERE LINK_PAGES_ID = @LINK_PAGES_ID
         AND RESPONSE_STATUS IS NOT NULL AND LTRIM(RTRIM(RESPONSE_STATUS)) <> ''
       ORDER BY RESPONSE_STATUS`
    );

  return (result.recordset || [])
    .map((row: any) => row.RESPONSE_STATUS)
    .filter((v: unknown): v is string => typeof v === "string" && v !== "");
};

export const savePurchaseInvoiceConversationService = async (
  data: PurchaseInvoiceConversationData
) => {
  const pageRefNo = fit(data.PAGE_REF_NO, "PAGE_REF_NO");
  if (pageRefNo === null) throw badRequest("Purchase Invoice Ref No is required");
  const responseEmpId = toInt(data.RESPONSE_EMP_ID, "Response Employee");
  const linkPagesId = linkPagesIdOf(data.LINK_PAGES_ID);

  await assertEmployeeExists(responseEmpId);

  /* A reply only makes sense against a saved invoice. */
  const parent = await pool()
    .request()
    .input("PURCHASE_INVOICE_REF_NO", sql.VarChar(MAX_LEN.PAGE_REF_NO), pageRefNo)
    .query(
      "SELECT 1 AS FOUND FROM [VPurchase].[TBL_PURCHASE_INVOICE_HDR] WHERE PURCHASE_INVOICE_REF_NO = @PURCHASE_INVOICE_REF_NO"
    );
  if (!parent.recordset?.length) {
    throw badRequest("Purchase Invoice Reference No does not exist");
  }

  const result = await pool()
    .request()
    .input("LINK_PAGES_ID", sql.Int, linkPagesId)
    .input("PAGE_REF_NO", sql.VarChar(MAX_LEN.PAGE_REF_NO), pageRefNo)
    .input("RESPONSE_EMP_ID", sql.Int, responseEmpId)
    .input("DISCUSSION_DETAILS", sql.VarChar(MAX_DISCUSSION), discussion(data.DISCUSSION_DETAILS))
    .input("RESPONSE_STATUS", sql.VarChar(MAX_LEN.RESPONSE_STATUS), fit(data.RESPONSE_STATUS, "RESPONSE_STATUS"))
    .input("REMARKS", sql.VarChar(MAX_LEN.REMARKS), fit(data.REMARKS, "REMARKS"))
    .input("STATUS_ENTRY", sql.VarChar(MAX_LEN.STATUS_ENTRY), fit(data.STATUS_ENTRY, "STATUS_ENTRY") || "CF")
    .input("USER", sql.VarChar(MAX_LEN.USER), fit(data.USER, "USER"))
    .input("MAC_ADDRESS", sql.VarChar(MAX_LEN.MAC_ADDRESS), fit(data.MAC_ADDRESS, "MAC_ADDRESS"))
    .query(
      `INSERT INTO [VMASTER].[TBL_TRANSACTION_APPROVAL_CONVERSATION_DTL]
       (
           LINK_PAGES_ID
          ,PAGE_REF_NO
          ,RESPONSE_EMP_ID
          ,DISCUSSION_DETAILS
          ,RESPONSE_STATUS
          ,RESPONSE_DATE
          ,REMARKS
          ,STATUS_ENTRY
          ,CREATED_BY
          ,CREATED_DATE
          ,CREATED_MAC_ADDRESS
          ,MODIFIED_BY
          ,MODIFIED_DATE
          ,MODIFIED_MAC_ADDRESS
       )
       OUTPUT INSERTED.CONVERSATION_ID
       VALUES
       (
           @LINK_PAGES_ID
          ,@PAGE_REF_NO
          ,@RESPONSE_EMP_ID
          ,@DISCUSSION_DETAILS
          ,@RESPONSE_STATUS
          ,GETDATE()
          ,@REMARKS
          ,@STATUS_ENTRY
          ,@USER
          ,GETDATE()
          ,@MAC_ADDRESS
          ,@USER
          ,GETDATE()
          ,@MAC_ADDRESS
       )`
    );

  const id = Number(result.recordset?.[0]?.CONVERSATION_ID ?? 0);
  return { CONVERSATION_ID: id, message: "Conversation saved successfully" };
};

export const updatePurchaseInvoiceConversationService = async (
  id: number | string,
  data: PurchaseInvoiceConversationData
) => {
  const conversationId = positiveId(id);
  const pageRefNo = fit(data.PAGE_REF_NO, "PAGE_REF_NO");
  if (pageRefNo === null) throw badRequest("Purchase Invoice Ref No is required");
  const linkPagesId = linkPagesIdOf(data.LINK_PAGES_ID);

  const existing = await pool()
    .request()
    .input("CONVERSATION_ID", sql.Int, conversationId)
    .input("LINK_PAGES_ID", sql.Int, linkPagesId)
    .query(
      `SELECT PAGE_REF_NO
       FROM [VMASTER].[TBL_TRANSACTION_APPROVAL_CONVERSATION_DTL]
       WHERE CONVERSATION_ID = @CONVERSATION_ID AND LINK_PAGES_ID = @LINK_PAGES_ID`
    );
  const row = existing.recordset?.[0];
  if (!row) throw notFound("Purchase Invoice Conversation not found");

  /* A reply belongs to the invoice it was raised under. */
  if (String(row.PAGE_REF_NO ?? "").trim() !== pageRefNo) {
    throw badRequest("Conversation cannot be moved to a different purchase invoice");
  }

  /* A field that is not sent keeps its stored value; a field that is sent as
     an empty string is cleared. The two cases are told apart by the presence
     of the key, not by its value. */
  const has = (key: string) => Object.prototype.hasOwnProperty.call(data, key);

  if (has("RESPONSE_EMP_ID")) {
    await assertEmployeeExists(toInt(data.RESPONSE_EMP_ID, "Response Employee"));
  }

  const result = await pool()
    .request()
    .input("CONVERSATION_ID", sql.Int, conversationId)
    .input("LINK_PAGES_ID", sql.Int, linkPagesId)
    .input("PAGE_REF_NO", sql.VarChar(MAX_LEN.PAGE_REF_NO), pageRefNo)
    .input("HAS_EMP", sql.Bit, has("RESPONSE_EMP_ID") ? 1 : 0)
    .input("RESPONSE_EMP_ID", sql.Int, toInt(data.RESPONSE_EMP_ID, "Response Employee"))
    .input("HAS_DISCUSSION", sql.Bit, has("DISCUSSION_DETAILS") ? 1 : 0)
    .input("DISCUSSION_DETAILS", sql.VarChar(MAX_DISCUSSION), discussion(data.DISCUSSION_DETAILS))
    .input("HAS_STATUS", sql.Bit, has("RESPONSE_STATUS") ? 1 : 0)
    .input("RESPONSE_STATUS", sql.VarChar(MAX_LEN.RESPONSE_STATUS), fit(data.RESPONSE_STATUS, "RESPONSE_STATUS"))
    .input("HAS_ENTRY", sql.Bit, has("STATUS_ENTRY") ? 1 : 0)
    .input("STATUS_ENTRY", sql.VarChar(MAX_LEN.STATUS_ENTRY), fit(data.STATUS_ENTRY, "STATUS_ENTRY"))
    .input("HAS_REMARKS", sql.Bit, has("REMARKS") ? 1 : 0)
    .input("REMARKS", sql.VarChar(MAX_LEN.REMARKS), fit(data.REMARKS, "REMARKS"))
    .input("USER", sql.VarChar(MAX_LEN.USER), fit(data.USER, "USER"))
    .input("MAC_ADDRESS", sql.VarChar(MAX_LEN.MAC_ADDRESS), fit(data.MAC_ADDRESS, "MAC_ADDRESS"))
    .query(
      `UPDATE [VMASTER].[TBL_TRANSACTION_APPROVAL_CONVERSATION_DTL]
       SET
            RESPONSE_EMP_ID      = CASE WHEN @HAS_EMP = 1 THEN @RESPONSE_EMP_ID ELSE RESPONSE_EMP_ID END
           ,DISCUSSION_DETAILS   = CASE WHEN @HAS_DISCUSSION = 1 THEN @DISCUSSION_DETAILS ELSE DISCUSSION_DETAILS END
           ,RESPONSE_STATUS      = CASE WHEN @HAS_STATUS = 1 THEN @RESPONSE_STATUS ELSE RESPONSE_STATUS END
           ,STATUS_ENTRY         = CASE WHEN @HAS_ENTRY = 1 AND @STATUS_ENTRY IS NOT NULL THEN @STATUS_ENTRY ELSE STATUS_ENTRY END
           ,REMARKS              = CASE WHEN @HAS_REMARKS = 1 THEN @REMARKS ELSE REMARKS END
           ,MODIFIED_BY          = @USER
           ,MODIFIED_DATE        = GETDATE()
           ,MODIFIED_MAC_ADDRESS = @MAC_ADDRESS
       WHERE CONVERSATION_ID = @CONVERSATION_ID AND LINK_PAGES_ID = @LINK_PAGES_ID`);

  return {
    CONVERSATION_ID: conversationId,
    message: result.rowsAffected?.[0] ? "Conversation updated successfully" : "No conversation was updated",
  };
};

export const deletePurchaseInvoiceConversationService = async (
  id: number | string,
  identity: ConversationIdentity,
  linkPagesId?: number | string | null
) => {
  const conversationId = positiveId(id);

  /* The role is taken from the session and passed through as-is. It must never
     be defaulted to Admin, because a missing role would then delete anything. */
  const role = fit(identity.ROLE, "ROLE");
  if (role !== "Admin") {
    throw forbidden("No Rights To Delete");
  }

  const result = await pool()
    .request()
    .input("CONVERSATION_ID", sql.Int, conversationId)
    .input("LINK_PAGES_ID", sql.Int, linkPagesIdOf(linkPagesId))
    .query(
      `DELETE FROM [VMASTER].[TBL_TRANSACTION_APPROVAL_CONVERSATION_DTL]
       WHERE CONVERSATION_ID = @CONVERSATION_ID AND LINK_PAGES_ID = @LINK_PAGES_ID`
    );

  if (!result.rowsAffected?.[0]) {
    throw notFound("Purchase Invoice Conversation not found");
  }
  return { CONVERSATION_ID: conversationId, message: "Conversation deleted successfully" };
};

/* Used when a purchase invoice is deleted: its thread goes with it, so no
   reply is left pointing at a document that no longer exists. */
export const deletePurchaseInvoiceConversationsByRefService = async (
  refNo: string,
  linkPagesId?: number | string | null
) => {
  const pageRefNo = fit(refNo, "PAGE_REF_NO");
  if (pageRefNo === null) return 0;

  const result = await pool()
    .request()
    .input("PAGE_REF_NO", sql.VarChar(MAX_LEN.PAGE_REF_NO), pageRefNo)
    .input("LINK_PAGES_ID", sql.Int, linkPagesIdOf(linkPagesId))
    .query(
      `DELETE FROM [VMASTER].[TBL_TRANSACTION_APPROVAL_CONVERSATION_DTL]
       WHERE PAGE_REF_NO = @PAGE_REF_NO AND LINK_PAGES_ID = @LINK_PAGES_ID`
    );

  return result.rowsAffected?.[0] ?? 0;
};

export const conversationFieldLimits = { ...MAX_LEN, DISCUSSION_DETAILS: MAX_DISCUSSION };
