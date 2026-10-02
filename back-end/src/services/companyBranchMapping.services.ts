import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

/** The mapping table stores the raw AC/IA code; the read procedures translate
 *  it to ACTIVE/INACTIVE and also expose the untouched value as STATUS_CODE. */
export interface CompanyBranchMappingData {
  MAPPING_ID?: number;
  COMPANY_ID?: number;
  BRANCH_ID?: number;
  STATUS_MASTER?: string;
  CREATED_BY?: string;
  CREATED_MAC_ADDRESS?: string;
  MODIFIED_BY?: string;
  MODIFIED_MAC_ADDRESS?: string;
}

export const MAPPING_STATUSES = ["AC", "IA"];

const serializeRecordset = (rows: any[]) =>
  (rows || []).map((r: any) => ({ ...r, id: r.MAPPING_ID }));

const pool_ = () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");
  return pool;
};

/* -------------------------------------------------------------------------
   Read
   ---------------------------------------------------------------------- */

/** The list endpoint. SHOW is filtered by one status at a time, so an
 *  "everything" request loops AC and IA and concatenates the results. */
export const getAllMappingService = async (status?: string) => {
  const pool = pool_();

  try {
    if (!status || status.toUpperCase() === "ALL") {
      let allRows: any[] = [];
      for (const s of MAPPING_STATUSES) {
        const result = await pool
          .request()
          .input("STATUS", sql.VarChar(20), s)
          .execute("VMaster.SP_COMPANY_BRANCH_MAPPING_SHOW");
        allRows = allRows.concat(result.recordset || []);
      }
      return serializeRecordset(allRows.sort((a, b) => b.MAPPING_ID - a.MAPPING_ID));
    }

    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(20), status)
      .execute("VMaster.SP_COMPANY_BRANCH_MAPPING_SHOW");

    return serializeRecordset(result.recordset || []);
  } catch (error) {
    console.error("SP_COMPANY_BRANCH_MAPPING_SHOW error:", error);
    throw error;
  }
};

/** Filter by company and/or branch; either may be null to ignore it. */
export const loadMappingService = async (companyId?: number, branchId?: number, status?: string) => {
  const pool = pool_();

  try {
    const result = await pool
      .request()
      .input("COMPANY_ID", sql.Int, companyId ?? null)
      .input("BRANCH_ID", sql.Int, branchId ?? null)
      .input("STATUS", sql.VarChar(20), status || "ALL")
      .execute("VMaster.SP_COMPANY_BRANCH_MAPPING_LOAD_BY_IDS");

    return serializeRecordset(result.recordset || []);
  } catch (error) {
    console.error("SP_COMPANY_BRANCH_MAPPING_LOAD_BY_IDS error:", error);
    throw error;
  }
};

/** Returns null when the row is absent so the controller can answer 404. */
export const getMappingByIdService = async (id: number) => {
  const pool = pool_();

  try {
    const result = await pool
      .request()
      .input("MAPPING_ID", sql.Int, id)
      .execute("VMaster.SP_COMPANY_BRANCH_MAPPING_GET_BY_ID");

    return result.recordset?.[0] || null;
  } catch (error) {
    console.error("SP_COMPANY_BRANCH_MAPPING_GET_BY_ID error:", error);
    throw error;
  }
};

/* -------------------------------------------------------------------------
   Write
   ---------------------------------------------------------------------- */

export const saveMappingService = async (data: CompanyBranchMappingData) => {
  const pool = pool_();

  try {
    const request = pool.request();
    request.output("NEW_MAPPING_ID", sql.Int);
    request.input("COMPANY_ID", sql.Int, data.COMPANY_ID ?? null);
    request.input("BRANCH_ID", sql.Int, data.BRANCH_ID ?? null);
    request.input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || "AC");
    request.input("CREATED_BY", sql.VarChar(50), data.CREATED_BY || "Admin");
    request.input("CREATED_MAC_ADDRESS", sql.VarChar(50), data.CREATED_MAC_ADDRESS || "WEB");

    const result = await request.execute("VMaster.SP_COMPANY_BRANCH_MAPPING_SAVE");

    const { message, data: savedData } = parseSprocResult(
      result.recordset?.[0],
      "Failed to save mapping"
    );

    return {
      message: message || "Data saved successfully",
      MAPPING_ID: savedData ?? result.output?.NEW_MAPPING_ID,
    };
  } catch (error) {
    console.error("SP_COMPANY_BRANCH_MAPPING_SAVE error:", error);
    throw error;
  }
};

export const updateMappingService = async (data: CompanyBranchMappingData) => {
  const pool = pool_();

  try {
    const result = await pool
      .request()
      .input("MAPPING_ID", sql.Int, data.MAPPING_ID ?? 0)
      .input("COMPANY_ID", sql.Int, data.COMPANY_ID ?? null)
      .input("BRANCH_ID", sql.Int, data.BRANCH_ID ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || "AC")
      .input("MODIFIED_BY", sql.VarChar(50), data.MODIFIED_BY || "Admin")
      .input("MODIFIED_MAC_ADDRESS", sql.VarChar(50), data.MODIFIED_MAC_ADDRESS || "WEB")
      .execute("VMaster.SP_COMPANY_BRANCH_MAPPING_UPDATE");

    const { message, data: updatedData } = parseSprocResult(
      result.recordset?.[0],
      "Failed to update mapping"
    );

    return {
      message: message || "Record updated successfully",
      MAPPING_ID: updatedData ?? data.MAPPING_ID,
    };
  } catch (error) {
    console.error("SP_COMPANY_BRANCH_MAPPING_UPDATE error:", error);
    throw error;
  }
};

export const deleteMappingService = async (
  id: number,
  user: string,
  role: string,
  macAddress: string
) => {
  const pool = pool_();

  try {
    const result = await pool
      .request()
      .input("MAPPING_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.SP_COMPANY_BRANCH_MAPPING_DELETE");

    const { message, data: deletedId } = parseSprocResult(
      result.recordset?.[0],
      "Failed to delete mapping"
    );

    return { message: message || "Record deleted successfully", MAPPING_ID: deletedId ?? id };
  } catch (error) {
    const msg = (error as any)?.message || "";
    if (msg.includes("REFERENCE constraint") || msg.includes("FK_")) {
      throw new Error("Cannot delete: This mapping has associated records.");
    }
    throw error;
  }
};
