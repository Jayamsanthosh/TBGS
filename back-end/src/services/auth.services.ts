import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface LoginRow {
  LOGIN_ID: number;
  LOGIN_NAME: string;
  ROLE: string;          // role name, display only
  ROLE_ID: number | null; // numeric id, used for authorization
  MAIL_ID: string;
  STOCK_SHOW_STATUS: string;
  OUTSIDE_ACCESS_Y_N: string;
  MONTH_PROCESS?: string;
  YEAR_PROCESS?: string;
  USER_STATUS: string;    // AC / IA
  ROLE_STATUS: string | null;
}

/**
 * Looks up the user by credentials AND enforces that both the user
 * account and its role are Active. Requires the updated
 * VMaster.LOGIN_USER stored procedure from rbac_migration.sql, which
 * now also returns ROLE_ID (joined from TBL_ROLE_MASTER).
 */
export const loginUser = async (loginName: string, password: string): Promise<LoginRow | null> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const result = await pool
    .request()
    .input("LOGIN_NAME", sql.VarChar(50), loginName)
    .input("PASSWORD", sql.VarChar(255), password)
    .execute("VMaster.LOGIN_USER");

  const row: any = result.recordset[0];
  if (!row) return null;

  // Retrieve USER_STATUS directly from TBL_USER_INFO_HDR since SP doesn't return it
  const userQuery = await pool
    .request()
    .input("LOGIN_ID", sql.Int, row.LOGIN_ID)
    .query(`SELECT STATUS_MASTER FROM VMaster.TBL_USER_INFO_HDR WHERE LOGIN_ID = @LOGIN_ID`);
  
  const userStatus = userQuery.recordset[0]?.STATUS_MASTER;
  const isUserActive = userStatus && ["AC", "ACTIVE"].includes(userStatus.trim().toUpperCase());
  if (userStatus && !isUserActive) {
    throw new Error("Your account is inactive. Please contact the administrator.");
  }

  // Gracefully handle Data mismatches for Role mapping via a trimmed lowercase lookup
  const roleQuery = await pool
    .request()
    .input("ROLE_NAME", sql.VarChar(50), (row.ROLE || "").trim())
    .query(`
      SELECT ROLE_ID, STATUS_MASTER 
      FROM VMaster.TBL_ROLE_MASTER 
      WHERE LOWER(LTRIM(RTRIM(ROLE_NAME))) = LOWER(@ROLE_NAME)
    `);

  const roleRecord = roleQuery.recordset[0];

  if (!roleRecord || !roleRecord.ROLE_ID) {
    throw new Error("This user is not mapped to a valid role. Please contact the administrator.");
  }

  const roleStatus = roleRecord.STATUS_MASTER;
  const isRoleActive = roleStatus && ["AC", "ACTIVE"].includes(roleStatus.trim().toUpperCase());
  if (roleStatus && !isRoleActive) {
    throw new Error("Your role is inactive. Please contact the administrator.");
  }

  return {
    ...row,
    ROLE_ID: roleRecord.ROLE_ID,
    USER_STATUS: userStatus,
    ROLE_STATUS: roleRecord.STATUS_MASTER,
  } as LoginRow;
};

export interface UserCompanyInfo {
  COMPANY_ID: number;
  COMPANY_NAME: string;
  SHORT_CODE: string;
  YEAR_CODE: string;
}

/**
 * Resolves the company(ies) a login is mapped to via
 * TBL_USER_TO_STORE_MAPPING, joined to company master.
 * Used to embed the logged-in user's company context into the JWT.
 */
export const getUserCompanyInfo = async (loginId: number): Promise<UserCompanyInfo[]> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const result = await pool
    .request()
    .input("LOGIN_ID", sql.Int, loginId)
    .query(`
      SELECT DISTINCT
        C.COMPANY_ID,
        C.COMPANY_NAME,
        C.SHORT_CODE,
        C.YEAR_CODE
      FROM VMaster.TBL_USER_TO_STORE_MAPPING M
      INNER JOIN VMaster.TBL_COMPANY_MASTER C ON C.COMPANY_ID = M.COMPANY_ID
      WHERE M.LOGIN_ID = @LOGIN_ID
        AND UPPER(M.STATUS_MASTER) IN ('AC', 'ACTIVE')
        AND UPPER(C.STATUS_MASTER) IN ('AC', 'ACTIVE')
      ORDER BY C.COMPANY_ID
    `);

  return result.recordset || [];
};

/** Company IDs the given login is mapped to (used to scope screen lists for non-admins). */
export const getAllowedCompanyIds = async (loginId: number): Promise<number[]> => {
  const companies = await getUserCompanyInfo(loginId);
  return companies.map((c) => c.COMPANY_ID).filter((id) => id != null);
};

export interface PermissionRow {
  LINK_ID: number;
  LINK_NAME: string;
  PAGE_ACTION: string;
  LINK_LOCATION: string;
  REDIRECTION_TYPE: string;
}

/** Every active screen/route a given role is allowed to access. */
export const getPermissionsByRoleId = async (roleId: number): Promise<PermissionRow[]> => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  // Fallback to manual query because VMaster.GET_ACTIVE_PERMISSIONS_BY_ROLE does not exist.
  const result = await pool
    .request()
    .input("ROLE_ID", sql.Int, roleId)
    .query(`
      SELECT 
          L.LINK_ID,
          L.LINK_NAME,
          L.PAGE_ACTION,
          L.LINK_LOCATION,
          L.REDIRECTION_TYPE
      FROM VMaster.TBL_ROLE_TO_LINK_AND_PAGE R
      INNER JOIN VMaster.TBL_LINKS_AND_PAGES L ON R.LINK_ID_ROLE_TO_LINK = L.LINK_ID
      WHERE R.ROLE_ID_ROLE_TO_LINK = @ROLE_ID
        AND UPPER(R.STATUS_ROLE_TO_LINK) IN ('AC', 'ACTIVE')
        AND UPPER(L.STATUS_MASTER) IN ('AC', 'ACTIVE')
    `);

  return result.recordset || [];
};

export interface ChangePasswordData {
  LOGIN_ID: number;
  USER_NAME: string;
  OLD_PASSWORD: string;
  NEW_PASSWORD: string;
  REASON: string;
  STATUS_MASTER: string;
  USER: string;
  MAC_ADDRESS: string;
}

export const changePasswordService = async (data: ChangePasswordData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("Login_id", sql.Int, data.LOGIN_ID)
      .input("User_Name", sql.VarChar(50), data.USER_NAME)
      .input("Old_Password", sql.VarChar(50), data.OLD_PASSWORD)
      .input("New_Password", sql.VarChar(50), data.NEW_PASSWORD)
      .input("Reason", sql.VarChar(50), data.REASON)
      .input("STATUS_MASTER", sql.VarChar(50), data.STATUS_MASTER)
      .input("User", sql.VarChar(50), data.USER)
      .input("Mac_address", sql.VarChar(50), data.MAC_ADDRESS)
      .execute("VMaster.Change_Password");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to change password");

    return { message: message || "Password changed successfully" };
  } catch (error) {
    console.error("Change_Password SP error:", error);
    throw error;
  }
};
