import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface DMSFileData {
  DMS_ID?: number;
  LINK_PAGES_ID?: number;
  PAGE_REF_NO?: string;
  DOCUMENT_TYPE?: string;
  DESCRIPTIONS?: string;
  FILE_NAME?: string;
  CONTENT_TYPE?: string;
  CONTENT_DATA?: string | Buffer | null;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
}

/* Column widths are taken from TBL_DOCUMENT_MANAGEMENT_SYSTEM. Sending a wider
   parameter than the column does not truncate, it makes SQL Server raise
   "String or binary data would be truncated", so lengths are validated up front
   and reported as a 400 instead of surfacing as a 500. */
const MAX_LEN = {
  PAGE_REF_NO: 50,
  DOCUMENT_TYPE: 50,
  DESCRIPTIONS: 100,
  FILE_NAME: 150,
  CONTENT_TYPE: 50,
  REMARKS: 100,
  STATUS_MASTER: 20,
} as const;

/* Matches the 10 MB ceiling the truck/trailer attachment endpoints enforce. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const badRequest = (message: string) => {
  const err = new Error(message) as Error & { httpStatus?: number };
  err.httpStatus = 400;
  return err;
};

const tooLarge = (message: string) => {
  const err = new Error(message) as Error & { httpStatus?: number };
  err.httpStatus = 413;
  return err;
};

const toInt = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

const text = (v: any): string | null => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
};

const fit = (v: any, key: keyof typeof MAX_LEN): string | null => {
  const s = text(v);
  if (s === null) return null;
  if (s.length > MAX_LEN[key]) {
    throw badRequest(`${key.replace(/_/g, " ").toLowerCase()} must be ${MAX_LEN[key]} characters or fewer`);
  }
  return s;
};

/* The browser sends the file as base64, which inflates the payload by about a
   third, so the limit is measured on the decoded size. */
const toBuffer = (value: any): Buffer | null => {
  if (value === undefined || value === null || value === "") return null;
  if (Buffer.isBuffer(value)) return value;
  if (typeof value === "string") {
    const buf = Buffer.from(value, "base64");
    return buf.length ? buf : null;
  }
  return null;
};

const toBase64 = (value: any): string | null => {
  if (value === undefined || value === null) return null;
  if (Buffer.isBuffer(value)) return value.toString("base64");
  if (typeof value === "string") return value;
  return null;
};

/* The list stored procedure deliberately omits CONTENT_DATA so a listing never
   drags megabytes of binary over the wire; it is only fetched per document. */
const serializeListRow = (r: any): any => ({ ...r, id: r.DMS_ID, CONTENT_DATA: null });

const requirePool = () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  return pool;
};

/* SHOW_DOCUMENT_MANAGEMENT_SYSTEM takes a single exact status, so an unfiltered
   listing has to cover both statuses this module writes. They are issued
   concurrently rather than in sequence to keep it to one round trip's latency. */
const LIST_STATUSES = ["AC", "IN"] as const;

const showForStatus = async (pool: any, status: string) => {
  const result = await pool
    .request()
    .input("STATUS", sql.VarChar(20), status)
    .execute("VMaster.SHOW_DOCUMENT_MANAGEMENT_SYSTEM");
  return result.recordset || [];
};

/* SHOW_LINKS_AND_PAGES exposes the page a document hangs off, but the document
   list stores only the numeric LINK_PAGES_ID, so the readable name is resolved
   here rather than making the caller join it. */
const linkNameMap = async (pool: any): Promise<Map<number, string>> => {
  try {
    const result = await pool.request().execute("VMaster.SHOW_LINKS_AND_PAGES");
    const map = new Map<number, string>();
    for (const r of result.recordset || []) {
      if (r?.LINK_ID != null) map.set(Number(r.LINK_ID), String(r.LINK_NAME ?? ""));
    }
    return map;
  } catch {
    /* the name is a convenience; a failure here must not break the listing */
    return new Map<number, string>();
  }
};

export const getAllDocumentsService = async (status?: string, linkPagesId?: number, pageRefNo?: string) => {
  const pool = requirePool();

  try {
    const wanted = status && status !== "ALL" ? [status] : [...LIST_STATUSES];
    const batches = await Promise.all(wanted.map((s) => showForStatus(pool, s)));
    let rows = batches.flat();

    if (linkPagesId !== undefined && linkPagesId !== null && !Number.isNaN(Number(linkPagesId))) {
      const target = Number(linkPagesId);
      rows = rows.filter((r: any) => Number(r.LINK_PAGES_ID) === target);
    }
    if (pageRefNo) {
      const target = String(pageRefNo).trim().toLowerCase();
      rows = rows.filter((r: any) => String(r.PAGE_REF_NO ?? "").trim().toLowerCase() === target);
    }

    rows = rows.sort((a: any, b: any) => Number(b.DMS_ID ?? 0) - Number(a.DMS_ID ?? 0));

    const names = await linkNameMap(pool);
    return rows.map((r: any) => ({
      ...serializeListRow(r),
      LINK_PAGES_NAME: r.LINK_PAGES_ID != null ? (names.get(Number(r.LINK_PAGES_ID)) ?? "") : "",
    }));
  } catch (error) {
    console.error("SHOW_DOCUMENT_MANAGEMENT_SYSTEM SP error:", error);
    throw error;
  }
};

/* There is no document-type master table, so the UI offers suggestions built
   from the values actually in use. Reads one small column and never CONTENT_DATA. */
export const getDocumentTypesService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const result = await pool.request().query(
    `SELECT DISTINCT LTRIM(RTRIM(DOCUMENT_TYPE)) AS DOCUMENT_TYPE
     FROM VMaster.TBL_DOCUMENT_MANAGEMENT_SYSTEM
     WHERE DOCUMENT_TYPE IS NOT NULL AND LTRIM(RTRIM(DOCUMENT_TYPE)) <> ''
     ORDER BY DOCUMENT_TYPE`
  );

  return (result.recordset || [])
    .map((row: any) => row.DOCUMENT_TYPE)
    .filter((value: unknown): value is string => typeof value === "string" && value !== "");
};

export const getDocumentByIdService = async (id: number) => {
  const pool = requirePool();

  try {
    const result = await pool
      .request()
      .input("DMS_ID", sql.Int, id)
      .execute("VMaster.GET_DOCUMENT_MANAGEMENT_SYSTEM");
    const row = result.recordset[0] || null;
    if (!row) return null;

    const names = await linkNameMap(pool);
    return {
      ...row,
      id: row.DMS_ID,
      CONTENT_DATA: toBase64(row.CONTENT_DATA),
      LINK_PAGES_NAME: row.LINK_PAGES_ID != null ? (names.get(Number(row.LINK_PAGES_ID)) ?? "") : "",
    };
  } catch (error) {
    console.error("GET_DOCUMENT_MANAGEMENT_SYSTEM SP error:", error);
    throw error;
  }
};

/* Real MIME types outrun the column: a .docx reports 71 characters and a .xlsx 65,
   but CONTENT_TYPE is only VARCHAR(50). Rather than reject those uploads, fall
   back to the generic binary type, which the UI already treats as "download".
   The real extension is still kept in FILE_NAME, so nothing is lost. */
const normaliseContentType = (value: string | undefined | null): string | null => {
  const cleaned = text(value);
  if (cleaned === null) return null;
  /* Short types (image/*, application/pdf, text/*) are kept as reported. */
  if (cleaned.length <= MAX_LEN.CONTENT_TYPE) return cleaned;
  return "application/octet-stream";
};

const executeDocument = async (pool: any, data: DMSFileData, spName: string, isUpdate: boolean) => {
  const pageRefNo = fit(data.PAGE_REF_NO, "PAGE_REF_NO");
  const documentType = fit(data.DOCUMENT_TYPE, "DOCUMENT_TYPE");
  const descriptions = fit(data.DESCRIPTIONS, "DESCRIPTIONS");
  const fileName = fit(data.FILE_NAME, "FILE_NAME");
  const contentType = normaliseContentType(data.CONTENT_TYPE);
  const remarks = fit(data.REMARKS, "REMARKS");
  const statusMaster = fit(data.STATUS_MASTER, "STATUS_MASTER") ?? "AC";

  const linkPagesId = toInt(data.LINK_PAGES_ID);
  if (linkPagesId === null) throw badRequest("Link page is required");
  if (!pageRefNo) throw badRequest("Page reference number is required");
  if (!fileName) throw badRequest("File name is required");

  const content = toBuffer(data.CONTENT_DATA);
  if (content && content.length > MAX_UPLOAD_BYTES) {
    throw tooLarge("File exceeds the 10 MB upload limit");
  }
  /* An update that does not re-send the file keeps whatever is already stored,
     so the binary stays optional on update and mandatory on insert. */
  if (!isUpdate && !content) throw badRequest("File content is required");

  const req = pool.request();
  req.input("DMS_ID", sql.Int, isUpdate ? toInt(data.DMS_ID) : 0);
  req.input("LINK_PAGES_ID", sql.Int, linkPagesId);
  req.input("PAGE_REF_NO", sql.VarChar(MAX_LEN.PAGE_REF_NO), pageRefNo);
  req.input("DOCUMENT_TYPE", sql.VarChar(MAX_LEN.DOCUMENT_TYPE), documentType);
  req.input("DESCRIPTIONS", sql.VarChar(MAX_LEN.DESCRIPTIONS), descriptions);
  req.input("FILE_NAME", sql.VarChar(MAX_LEN.FILE_NAME), fileName);
  req.input("CONTENT_TYPE", sql.VarChar(MAX_LEN.CONTENT_TYPE), contentType);
  req.input("CONTENT_DATA", sql.VarBinary(sql.MAX), content);
  req.input("REMARKS", sql.VarChar(MAX_LEN.REMARKS), remarks);
  req.input("STATUS_MASTER", sql.VarChar(MAX_LEN.STATUS_MASTER), statusMaster);
  req.input("USER", sql.VarChar(50), text(data.USER) ?? "Admin");
  req.input("MAC_ADDRESS", sql.VarChar(50), text(data.MAC_ADDRESS) ?? "WEB");

  return req.execute(spName);
};

export const saveDocumentService = async (data: DMSFileData) => {
  const pool = requirePool();

  try {
    const result = await executeDocument(pool, data, "VMaster.SAVE_DOCUMENT_MANAGEMENT_SYSTEM", false);
    const { data: newId } = parseSprocResult(result.recordset?.[0], "Failed to upload file");

    return {
      message: "Data Saved Successfully",
      DMS_ID: toInt(newId),
    };
  } catch (error) {
    /* Validation refusals are expected client errors, not procedure failures. */
    if (!(error as any)?.httpStatus) console.error("SAVE_DOCUMENT_MANAGEMENT_SYSTEM SP error:", error);
    throw error;
  }
};

export const updateDocumentService = async (data: DMSFileData) => {
  const pool = requirePool();

  const id = toInt(data.DMS_ID);
  if (id === null) throw badRequest("Document ID is required");

  /* The procedure sets NOCOUNT ON, which suppresses the row count the driver
     would otherwise report, so an update that matched nothing still looks like a
     success. Existence is confirmed up front instead. EXISTS is answered from the
     clustered primary key, so this does not drag the stored blob across. */
  const exists = await pool
    .request()
    .input("DMS_ID", sql.Int, id)
    .query(`SELECT CASE WHEN EXISTS(
              SELECT 1 FROM VMaster.TBL_DOCUMENT_MANAGEMENT_SYSTEM WHERE DMS_ID = @DMS_ID
            ) THEN 1 ELSE 0 END AS FOUND`);
  if (Number(exists.recordset?.[0]?.FOUND ?? 0) !== 1) {
    throw badRequest("Document not found");
  }

  try {
    const result = await executeDocument(pool, { ...data, DMS_ID: id }, "VMaster.UPDATE_DOCUMENT_MANAGEMENT_SYSTEM", true);
    const { message } = parseSprocResult(result.recordset?.[0], "Failed to update file");
    return { message: message || "Data Updated Successfully", DMS_ID: id };
  } catch (error) {
    if (!(error as any)?.httpStatus) console.error("UPDATE_DOCUMENT_MANAGEMENT_SYSTEM SP error:", error);
    throw error;
  }
};

export const deleteDocumentService = async (id: number, user: string, role: string, macAddress: string) => {
  const pool = requirePool();

  try {
    const result = await pool
      .request()
      .input("DMS_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_DOCUMENT_MANAGEMENT_SYSTEM");

    const { message } = parseSprocResult(result.recordset?.[0], "No rights to delete");
    return { message: message || "Data Deleted Successfully", DMS_ID: id };
  } catch (error) {
    if (!(error as any)?.httpStatus) console.error("DELETE_DOCUMENT_MANAGEMENT_SYSTEM SP error:", error);
    throw error;
  }
};
