import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface RoleToLinkData {
  ROLE_TO_LINK_ID_ROLE_TO_LINK?: number;
  ROLE_ID_TO_LINK: number;
  LINK_ID_ROLE_TO_LINK: number;
  STATUS_ROLE_TO_LINK: string;
  USER_ROLE_TO_LINK?: string;
  MAC_ADDR_ROLE_TO_LINK?: string;
}

export interface RoleToLinkSyncData {
  ROLE_ID_TO_LINK: number;
  LINK_ID_ROLE_TO_LINK: number[];
  STATUS_ROLE_TO_LINK?: string;
  USER_ROLE_TO_LINK?: string;
  MAC_ADDR_ROLE_TO_LINK?: string;
}

export const getAllRoleToLinkService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool.request().query(`
      SELECT
        A.[ROLE_TO_LINK_ID_ROLE_TO_LINK],
        B.[ROLE_NAME],
        C.[LINK_NAME],
        A.[STATUS_ROLE_TO_LINK] AS STATUS
      FROM [vmaster].[TBL_ROLE_TO_LINK_AND_PAGE] A
      INNER JOIN [vmaster].[TBL_ROLE_MASTER] B ON A.[ROLE_ID_ROLE_TO_LINK] = B.[ROLE_ID]
      INNER JOIN [vmaster].[TBL_LINKS_AND_PAGES] C ON A.[LINK_ID_ROLE_TO_LINK] = C.[LINK_ID]
      ORDER BY A.[ROLE_TO_LINK_ID_ROLE_TO_LINK]
    `);
    return result.recordset || [];
  } catch (error) {
    console.error("getAllRoleToLink query error:", error);
    throw error;
  }
};

export const getRoleToLinkByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("ROLE_TO_LINK_ID_ROLE_TO_LINK", sql.Int, id)
      .execute("VMaster.GET_TO_LINK_AND_PAGE");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_TO_LINK_AND_PAGE SP error:", error);
    throw error;
  }
};

// Normalize status values to match DB convention ('AC' for Active)
const normalizeStatus = (status: string | undefined | null): string => {
  if (!status) return 'AC';
  const s = status.trim().toUpperCase();
  if (s === 'ACTIVE' || s === 'AC') return 'AC';
  if (s === 'INACTIVE' || s === 'IN') return 'IN';
  return s.substring(0, 2);
};

export const saveRoleToLinkService = async (data: RoleToLinkData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const existing = await pool
      .request()
      .input("ROLE_ID", sql.Int, data.ROLE_ID_TO_LINK ?? 0)
      .input("LINK_ID", sql.Int, data.LINK_ID_ROLE_TO_LINK ?? 0)
      .query(`
        SELECT TOP 1 [ROLE_TO_LINK_ID_ROLE_TO_LINK]
        FROM [vmaster].[TBL_ROLE_TO_LINK_AND_PAGE]
        WHERE [ROLE_ID_ROLE_TO_LINK] = @ROLE_ID
          AND [LINK_ID_ROLE_TO_LINK] = @LINK_ID
      `);

    if (existing.recordset.length > 0) {
      return { message: "Role link already exists for this role and page" };
    }

    const result = await pool
      .request()
      .input("ROLE_TO_LINK_ID_ROLE_TO_LINK", sql.Int, data.ROLE_TO_LINK_ID_ROLE_TO_LINK ?? 0)
      .input("ROLE_ID_TO_LINK", sql.Int, data.ROLE_ID_TO_LINK ?? 0)
      .input("LINK_ID_ROLE_TO_LINK", sql.Int, data.LINK_ID_ROLE_TO_LINK ?? 0)
      .input("STATUS_ROLE_TO_LINK", sql.VarChar(20), normalizeStatus(data.STATUS_ROLE_TO_LINK))
      .input("USER_ROLE_TO_LINK", sql.VarChar(50), data.USER_ROLE_TO_LINK || "Admin")
      .input("MAC_ADDR_ROLE_TO_LINK", sql.VarChar(50), data.MAC_ADDR_ROLE_TO_LINK || "WEB")
      .execute("VMaster.SAVE_TO_LINK_AND_PAGE");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to save role link");

    return { message: message || "Role link saved successfully" };
  } catch (error) {
    console.error("SAVE_TO_LINK_AND_PAGE SP error:", error);
    throw error;
  }
};

export const updateRoleToLinkService = async (data: RoleToLinkData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("ROLE_TO_LINK_ID_ROLE_TO_LINK", sql.Int, data.ROLE_TO_LINK_ID_ROLE_TO_LINK ?? 0)
      .input("ROLE_ID_TO_LINK", sql.Int, data.ROLE_ID_TO_LINK ?? 0)
      .input("LINK_ID_ROLE_TO_LINK", sql.Int, data.LINK_ID_ROLE_TO_LINK ?? 0)
      .input("STATUS_ROLE_TO_LINK", sql.VarChar(20), normalizeStatus(data.STATUS_ROLE_TO_LINK))
      .input("USER_ROLE_TO_LINK", sql.VarChar(50), data.USER_ROLE_TO_LINK ?? "Admin")
      .input("MAC_ADDR_ROLE_TO_LINK", sql.VarChar(50), data.MAC_ADDR_ROLE_TO_LINK ?? "WEB")
      .execute("VMaster.UPDATE_TO_LINK_AND_PAGE");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to update role link");

    return { message: message || "Role link updated successfully" };
  } catch (error) {
    console.error("UPDATE_TO_LINK_AND_PAGE SP error:", error);
    throw error;
  }
};

export const deleteRoleToLinkService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    await pool
      .request()
      .input("ROLE_TO_LINK_ID_ROLE_TO_LINK", sql.Int, id)
      .query("DELETE FROM [vmaster].[TBL_ROLE_TO_LINK_AND_PAGE] WHERE [ROLE_TO_LINK_ID_ROLE_TO_LINK] = @ROLE_TO_LINK_ID_ROLE_TO_LINK");

    return { message: "Role link deleted successfully" };
  } catch (error) {
    console.error("deleteRoleToLink error:", error);
    throw error;
  }
};

// Reconciles the FULL set of links for a role in a single transaction:
// adds missing links, removes unselected ones, and updates the status of kept ones.
export const syncRoleToLinkService = async (data: RoleToLinkSyncData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const roleId = Number(data.ROLE_ID_TO_LINK) || 0;
  const linkIds = (data.LINK_ID_ROLE_TO_LINK || [])
    .map(Number)
    .filter((id) => Number.isFinite(id) && id > 0);
  const status = normalizeStatus(data.STATUS_ROLE_TO_LINK);
  const user = data.USER_ROLE_TO_LINK || "Admin";
  const mac = data.MAC_ADDR_ROLE_TO_LINK || "WEB";

  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();

    const existingRes = await new sql.Request(transaction)
      .input("ROLE_ID_TO_LINK", sql.Int, roleId)
      .query(`
        SELECT [LINK_ID_ROLE_TO_LINK]
        FROM [vmaster].[TBL_ROLE_TO_LINK_AND_PAGE]
        WHERE [ROLE_ID_ROLE_TO_LINK] = @ROLE_ID_TO_LINK
      `);
    const existingIds = new Set<number>();
    (existingRes.recordset || []).forEach((r) => existingIds.add(Number(r.LINK_ID_ROLE_TO_LINK)));

    const finalSet = new Set(linkIds);
    const toDelete = Array.from(existingIds).filter((id) => !finalSet.has(id));
    const toAdd = linkIds.filter((id) => !existingIds.has(id));
    const toUpdate = linkIds.filter((id) => existingIds.has(id));

    if (toDelete.length > 0) {
      const delReq = new sql.Request(transaction);
      delReq.input("ROLE_ID_TO_LINK", sql.Int, roleId);
      toDelete.forEach((id, i) => delReq.input(`LinkId${i}`, sql.Int, id));
      await delReq.query(`
        DELETE FROM [vmaster].[TBL_ROLE_TO_LINK_AND_PAGE]
        WHERE [ROLE_ID_ROLE_TO_LINK] = @ROLE_ID_TO_LINK
          AND [LINK_ID_ROLE_TO_LINK] IN (${toDelete.map((_, i) => `@LinkId${i}`).join(", ")})
      `);
    }

    if (toAdd.length > 0) {
      const insReq = new sql.Request(transaction);
      insReq.input("ROLE_ID_TO_LINK", sql.Int, roleId);
      insReq.input("STATUS_ROLE_TO_LINK", sql.VarChar(20), status);
      insReq.input("USER_ROLE_TO_LINK", sql.VarChar(50), user);
      insReq.input("MAC_ADDR_ROLE_TO_LINK", sql.VarChar(50), mac);
      toAdd.forEach((id, i) => insReq.input(`LinkId${i}`, sql.Int, id));
      await insReq.query(`
        INSERT INTO [vmaster].[TBL_ROLE_TO_LINK_AND_PAGE]
            ([ROLE_ID_ROLE_TO_LINK], [LINK_ID_ROLE_TO_LINK], [STATUS_ROLE_TO_LINK],
             [CREATED_USER_ROLE_TO_LINK], [CREATED_DATE_ROLE_TO_LINK], [CREATED_MAC_ADDR_ROLE_TO_LINK],
             [MODIFIED_USER_ROLE_TO_LINK], [MODIFIED_DATE_ROLE_TO_LINK], [MODIFIED_MAC_ADDR_ROLE_TO_LINK])
        SELECT @ROLE_ID_TO_LINK, t.linkId, @STATUS_ROLE_TO_LINK, @USER_ROLE_TO_LINK, GETDATE(), @MAC_ADDR_ROLE_TO_LINK, @USER_ROLE_TO_LINK, GETDATE(), @MAC_ADDR_ROLE_TO_LINK
        FROM (VALUES ${toAdd.map((_, i) => `(@LinkId${i})`).join(", ")}) AS t(linkId)
      `);
    }

    if (toUpdate.length > 0) {
      const updReq = new sql.Request(transaction);
      updReq.input("ROLE_ID_TO_LINK", sql.Int, roleId);
      updReq.input("STATUS_ROLE_TO_LINK", sql.VarChar(20), status);
      updReq.input("USER_ROLE_TO_LINK", sql.VarChar(50), user);
      updReq.input("MAC_ADDR_ROLE_TO_LINK", sql.VarChar(50), mac);
      toUpdate.forEach((id, i) => updReq.input(`LinkId${i}`, sql.Int, id));
      await updReq.query(`
        UPDATE [vmaster].[TBL_ROLE_TO_LINK_AND_PAGE]
        SET [STATUS_ROLE_TO_LINK] = @STATUS_ROLE_TO_LINK,
            [MODIFIED_USER_ROLE_TO_LINK] = @USER_ROLE_TO_LINK,
            [MODIFIED_DATE_ROLE_TO_LINK] = GETDATE(),
            [MODIFIED_MAC_ADDR_ROLE_TO_LINK] = @MAC_ADDR_ROLE_TO_LINK
        WHERE [ROLE_ID_ROLE_TO_LINK] = @ROLE_ID_TO_LINK
          AND [LINK_ID_ROLE_TO_LINK] IN (${toUpdate.map((_, i) => `@LinkId${i}`).join(", ")})
      `);
    }

    await transaction.commit();
    return { added: toAdd.length, deleted: toDelete.length, updated: toUpdate.length };
  } catch (error) {
    await transaction.rollback().catch(() => {});
    console.error("syncRoleToLink transaction error:", error);
    throw error;
  }
};
