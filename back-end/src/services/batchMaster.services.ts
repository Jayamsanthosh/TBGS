import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult, pickResultRow } from "../utils/sprocResult";

export interface BatchMasterData {
  BATCH_ID?: number;
  BATCH_NO?: string;
  LINK_PAGES_ID?: number | null;
  LINK_ID?: number | null;
  BATCH_SOURCE_REF_NO?: string;
  BATCH_SOURCE_DTL_ID?: number | null;
  COMPANY_ID?: number | null;
  CAMP_ID?: number | null;
  STORE_ID?: number | null;
  PRODUCT_ID?: number | null;
  BATCH_QTY?: any;
  UOM_ID?: number | null;
  MANUFACTURE_DATE?: string;
  EXPIRY_DATE?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const dateOrNull = (v: any): Date | null => (v ? new Date(v) : null);

const numOrNull = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

/* The batch master is shared by the inventory documents (Purchase GRN,
   Opening Stock). Rows are linked back to their source document through
   BATCH_SOURCE_REF_NO (the document ref) and BATCH_SOURCE_DTL_ID (the source
   detail line), so "the batches of one document" is a filtered view. */

/* -------------------------------------------------------------- list */
/* Rows are read straight from the table: the batched SHOW_BATCH_MASTER has a
   malformed EXPIRY_DATE select that returns REMARKS as the literal 'EXPIRY_DATE'
   and drops the real expiry, so it is bypassed. Writes still go through the SPs. */
export const listBatchesBySourceService = async (refNo: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("REF_NO", sql.VarChar(50), refNo ?? "")
      .query(
        `SELECT BATCH_ID, BATCH_NO, LINK_PAGES_ID, BATCH_SOURCE_REF_NO,
                BATCH_SOURCE_DTL_ID, COMPANY_ID, CAMP_ID, STORE_ID, PRODUCT_ID,
                BATCH_QTY, UOM_ID, MANUFACTURE_DATE, EXPIRY_DATE, REMARKS,
                STATUS_MASTER, CREATED_BY, MODIFIED_BY
           FROM [VInventory].[TBL_BATCH_MASTER]
          WHERE BATCH_SOURCE_REF_NO = @REF_NO
          ORDER BY BATCH_ID`
      );
    return result.recordset || [];
  } catch (error) {
    console.error("list batch rows error:", error);
    throw error;
  }
};

/* --------------------------------------------------------- single row */
export const getBatchService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("BATCH_ID", sql.Int, id)
      .query(
        `SELECT BATCH_ID, BATCH_NO, LINK_PAGES_ID, BATCH_SOURCE_REF_NO,
                BATCH_SOURCE_DTL_ID, COMPANY_ID, CAMP_ID, STORE_ID, PRODUCT_ID,
                BATCH_QTY, UOM_ID, MANUFACTURE_DATE, EXPIRY_DATE, REMARKS,
                STATUS_MASTER, CREATED_BY, MODIFIED_BY
           FROM [VInventory].[TBL_BATCH_MASTER]
          WHERE BATCH_ID = @BATCH_ID`
      );

    const row = result.recordset?.[0] || null;
    if (!row) throw new Error("Batch not found");
    return row;
  } catch (error) {
    console.error("GET batch row error:", error);
    throw error;
  }
};

/* The batch procs take the page link id as @Link_Id and write it into the
   LINK_ID column of the row, but that parameter is not in every deployment of
   the procedure. node-mssql binds the inputs by name, so both directions
   break the call: a parameter the procedure does not declare fails with
   "@Link_Id is not a parameter for procedure", and one it declares but the
   caller leaves out fails with "expects parameter '@Link_Id', which was not
   supplied". The parameter list of the procedure decides, so it is read once
   and cached; when the parameter is missing the link id is written by the
   fallback update below. */
const procParamCache = new Map<string, { at: number; names: Set<string> }>();

const procParamNames = async (pool: any, procName: string): Promise<Set<string>> => {
  const cached = procParamCache.get(procName);
  if (cached && Date.now() - cached.at < 60_000) return cached.names;

  const result = await pool
    .request()
    .input("PROC_NAME", procName)
    .query(
      `SELECT p.name AS PARAM_NAME
         FROM sys.parameters p
        WHERE p.object_id = OBJECT_ID(@PROC_NAME)`
    );
  const names = new Set<string>(
    (result.recordset || [])
      .map((r: any) => String(r.PARAM_NAME).replace(/^@/, "").toLowerCase())
  );
  procParamCache.set(procName, { at: Date.now(), names });
  return names;
};

/* Shared input chain - the column order must match the deployed
   SAVE/UPDATE_BATCH_MASTER signatures exactly (node-mssql binds the inputs
   positionally). UPDATE primes @BATCH_ID first. */
const batchRequest = async (
  pool: any,
  req: any,
  data: BatchMasterData,
  procName: string
) => {
  const names = await procParamNames(pool, procName);

  const chain = req
    .input("BATCH_NO", sql.VarChar(100), data.BATCH_NO || null)
    .input("LINK_PAGES_ID", sql.Int, numOrNull(data.LINK_PAGES_ID))
    .input("BATCH_SOURCE_REF_NO", sql.VarChar(50), data.BATCH_SOURCE_REF_NO || null)
    .input("BATCH_SOURCE_DTL_ID", sql.Int, numOrNull(data.BATCH_SOURCE_DTL_ID))
    .input("COMPANY_ID", sql.Int, numOrNull(data.COMPANY_ID))
    .input("CAMP_ID", sql.Int, numOrNull(data.CAMP_ID))
    .input("STORE_ID", sql.Int, numOrNull(data.STORE_ID))
    .input("PRODUCT_ID", sql.Int, numOrNull(data.PRODUCT_ID))
    .input("BATCH_QTY", sql.Decimal(15, 4), numOrNull(data.BATCH_QTY))
    .input("UOM_ID", sql.Int, numOrNull(data.UOM_ID))
    .input("MANUFACTURE_DATE", sql.DateTime, dateOrNull(data.MANUFACTURE_DATE))
    .input("EXPIRY_DATE", sql.DateTime, dateOrNull(data.EXPIRY_DATE))
    .input("REMARKS", sql.VarChar(500), data.REMARKS || null)
    .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || "AC")
    .input("USER", sql.VarChar(50), data.USER || "Admin")
    .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB");

  /* Only when the procedure declares it - see the note above. */
  if (names.has("link_id")) {
    chain.input(
      "Link_Id",
      sql.Int,
      numOrNull(data.LINK_ID ?? data.LINK_PAGES_ID)
    );
  }

  return chain;
};

/* The batch procs write the page link id into the LINK_ID column themselves
   when they take @Link_Id. This mirrors it for the deployments whose procedure
   does not have that parameter. */
const syncBatchLinkId = async (pool: any, batchId: any, linkId: any) => {
  const id = numOrNull(batchId);
  const value = numOrNull(linkId);
  if (id === null || value === null) return;
  await pool
    .request()
    .input("BATCH_ID", sql.Int, id)
    .input("LINK_ID", sql.Int, value)
    .query("UPDATE [VInventory].[TBL_BATCH_MASTER] SET LINK_ID = @LINK_ID WHERE BATCH_ID = @BATCH_ID");
};

/* ------------------------------------------------------------- create */
export const saveBatchService = async (data: BatchMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await (
      await batchRequest(pool, pool.request(), data, "VInventory.SAVE_BATCH_MASTER")
    ).execute("VInventory.SAVE_BATCH_MASTER");

    const { message, data: insertedId } = parseSprocResult(
      pickResultRow(result),
      "Failed to save batch"
    );
    await syncBatchLinkId(pool, insertedId, data.LINK_ID ?? data.LINK_PAGES_ID);
    return { message: message || "Batch saved successfully", BATCH_ID: numOrNull(insertedId) };
  } catch (error) {
    console.error("SAVE_BATCH_MASTER SP error:", error);
    throw error;
  }
};

/* ------------------------------------------------------------- update */
export const updateBatchService = async (data: BatchMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const base = pool
      .request()
      .input("BATCH_ID", sql.Int, numOrNull(data.BATCH_ID) ?? 0);

    const result = await (
      await batchRequest(pool, base, data, "VInventory.UPDATE_BATCH_MASTER")
    ).execute("VInventory.UPDATE_BATCH_MASTER");

    const { message } = parseSprocResult(pickResultRow(result), "Failed to update batch");
    await syncBatchLinkId(pool, data.BATCH_ID, data.LINK_ID ?? data.LINK_PAGES_ID);
    return { message: message || "Batch updated successfully" };
  } catch (error) {
    console.error("UPDATE_BATCH_MASTER SP error:", error);
    throw error;
  }
};

/* ------------------------------------------------------------- delete */
export const deleteBatchService = async (
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
      .input("BATCH_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VInventory.DELETE_BATCH_MASTER");

    const { message } = parseSprocResult(pickResultRow(result), "Failed to delete batch");
    return { message: message || "Batch deleted successfully" };
  } catch (error) {
    console.error("DELETE_BATCH_MASTER SP error:", error);
    throw error;
  }
};
