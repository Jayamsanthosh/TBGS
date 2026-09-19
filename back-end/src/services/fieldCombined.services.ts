import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface FieldCombinedDtl {
  ACTIVITY_ID_FLD_DTL?: number;
  ACTIVITY_NAME_FLD_DTL: string;
  ACTIVITY_DESC_FLD_DTL?: string;
  REMARKS_FLD_DTL?: string;
  STATUS_FLD_DTL?: string;
}

export interface FieldCombinedData {
  FIELD_ID_FLD_HDR?: number;
  PROJECT_NAME_FLD_HDR: string;
  FIELD_CATEGORY_FLD_HDR?: string;
  FIELD_DESC_FLD_HDR?: string;
  REMARKS_FLD_HDR?: string;
  STATUS_FLD_HDR?: string;
  dtls?: FieldCombinedDtl[];
  deletedIds?: number[];
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllFieldCombinedService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const [hdrResult, dtlResult] = await Promise.all([
      pool.request().execute("VMaster.SHOW_FIELD_HDR"),
      pool.request().execute("VMaster.SHOW_FIELD_DTL")
    ]);

    const hdrs = hdrResult.recordset || [];
    const dtls = dtlResult.recordset || [];

    const hdrMap = new Map<number, any>();
    for (const h of hdrs) {
      hdrMap.set(h.FIELD_ID_FLD_HDR, h);
    }

    const combined = dtls.map((dtl: any) => {
      const hdr = hdrMap.get(dtl.FIELD_ID_FLD_DTL) || {};
      return { ...hdr, ...dtl };
    });

    return combined;
  } catch (error) {
    console.error("SHOW_FIELD_COMBINED error:", error);
    throw error;
  }
};

export const saveFieldCombinedService = async (data: FieldCombinedData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const hdrResult = await pool
      .request()
      .input("FIELD_ID_FLD_HDR", sql.Int, 0)
      .input("PROJECT_NAME_FLD_HDR", sql.VarChar(200), data.PROJECT_NAME_FLD_HDR || null)
      .input("FIELD_CATEGORY_FLD_HDR", sql.VarChar(200), data.FIELD_CATEGORY_FLD_HDR || null)
      .input("FIELD_DESC_FLD_HDR", sql.VarChar(500), data.FIELD_DESC_FLD_HDR || null)
      .input("REMARKS_FLD_HDR", sql.VarChar(1000), data.REMARKS_FLD_HDR || null)
      .input("STATUS_FLD_HDR", sql.VarChar(50), data.STATUS_FLD_HDR || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_FIELD_HDR");

    const hdrResponse = hdrResult.recordset?.[0];
    const hdrParsed = parseSprocResult(hdrResponse, "Failed to save field header");

    const fieldId = hdrParsed.data;
    if (!fieldId) throw new Error("Could not determine field header ID");

    const dtls = Array.isArray(data.dtls) ? data.dtls : [];
    for (const dtl of dtls) {
      const dtlResult = await pool
        .request()
        .input("ACTIVITY_ID_FLD_DTL", sql.Int, 0)
        .input("FIELD_ID_FLD_DTL", sql.Int, fieldId)
        .input("ACTIVITY_NAME_FLD_DTL", sql.VarChar(200), dtl.ACTIVITY_NAME_FLD_DTL || null)
        .input("ACTIVITY_DESC_FLD_DTL", sql.VarChar(500), dtl.ACTIVITY_NAME_FLD_DTL || null)
        .input("REMARKS_FLD_DTL", sql.VarChar(1000), dtl.REMARKS_FLD_DTL || null)
        .input("STATUS_FLD_DTL", sql.VarChar(50), dtl.STATUS_FLD_DTL || null)
        .input("USER", sql.VarChar(50), data.USER || "Admin")
        .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
        .execute("VMaster.SAVE_FIELD_DTL");

      const dtlResponse = dtlResult.recordset?.[0];
      parseSprocResult(dtlResponse, "Failed to save field detail");
    }

    return { message: "Field saved successfully", FIELD_ID_FLD_HDR: fieldId };
  } catch (error) {
    console.error("SAVE_FIELD_COMBINED error:", error);
    throw error;
  }
};

export const updateFieldCombinedService = async (data: FieldCombinedData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const hdrResult = await pool
      .request()
      .input("FIELD_ID_FLD_HDR", sql.Int, data.FIELD_ID_FLD_HDR ?? 0)
      .input("PROJECT_NAME_FLD_HDR", sql.VarChar(200), data.PROJECT_NAME_FLD_HDR ?? null)
      .input("FIELD_CATEGORY_FLD_HDR", sql.VarChar(200), data.FIELD_CATEGORY_FLD_HDR ?? null)
      .input("FIELD_DESC_FLD_HDR", sql.VarChar(500), data.FIELD_DESC_FLD_HDR ?? null)
      .input("REMARKS_FLD_HDR", sql.VarChar(1000), data.REMARKS_FLD_HDR ?? null)
      .input("STATUS_FLD_HDR", sql.VarChar(50), data.STATUS_FLD_HDR ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_FIELD_HDR");

    const hdrResponse = hdrResult.recordset?.[0];
    parseSprocResult(hdrResponse, "Failed to update field header");

    const dtls = Array.isArray(data.dtls) ? data.dtls : [];
    for (const dtl of dtls) {
      if (dtl.ACTIVITY_ID_FLD_DTL) {
        const dtlResult = await pool
          .request()
          .input("ACTIVITY_ID_FLD_DTL", sql.Int, dtl.ACTIVITY_ID_FLD_DTL)
          .input("FIELD_ID_FLD_DTL", sql.Int, data.FIELD_ID_FLD_HDR ?? 0)
          .input("ACTIVITY_NAME_FLD_DTL", sql.VarChar(200), dtl.ACTIVITY_NAME_FLD_DTL || null)
          .input("ACTIVITY_DESC_FLD_DTL", sql.VarChar(500), dtl.ACTIVITY_NAME_FLD_DTL || null)
          .input("REMARKS_FLD_DTL", sql.VarChar(1000), dtl.REMARKS_FLD_DTL || null)
          .input("STATUS_FLD_DTL", sql.VarChar(50), dtl.STATUS_FLD_DTL || null)
          .input("USER", sql.VarChar(50), data.USER ?? "Admin")
          .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
          .execute("VMaster.UPDATE_FIELD_DTL");

        const dtlResponse = dtlResult.recordset?.[0];
        parseSprocResult(dtlResponse, "Failed to update field detail");
      } else {
        const dtlResult = await pool
          .request()
          .input("ACTIVITY_ID_FLD_DTL", sql.Int, 0)
          .input("FIELD_ID_FLD_DTL", sql.Int, data.FIELD_ID_FLD_HDR ?? 0)
          .input("ACTIVITY_NAME_FLD_DTL", sql.VarChar(200), dtl.ACTIVITY_NAME_FLD_DTL || null)
          .input("ACTIVITY_DESC_FLD_DTL", sql.VarChar(500), dtl.ACTIVITY_NAME_FLD_DTL || null)
          .input("REMARKS_FLD_DTL", sql.VarChar(1000), dtl.REMARKS_FLD_DTL || null)
          .input("STATUS_FLD_DTL", sql.VarChar(50), dtl.STATUS_FLD_DTL || null)
          .input("USER", sql.VarChar(50), data.USER ?? "Admin")
          .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
          .execute("VMaster.SAVE_FIELD_DTL");

        const dtlResponse = dtlResult.recordset?.[0];
        parseSprocResult(dtlResponse, "Failed to save field detail");
      }
    }

    const deletedIds = Array.isArray(data.deletedIds) ? data.deletedIds : [];
    for (const id of deletedIds) {
      await deleteFieldCombinedService(id);
    }

    return { message: "Field updated successfully" };
  } catch (error) {
    console.error("UPDATE_FIELD_COMBINED error:", error);
    throw error;
  }
};

export const deleteFieldCombinedService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("ACTIVITY_ID_FLD_DTL", sql.Int, id)
      .execute("VMaster.DELETE_FIELD_DTL");

    const response = result.recordset?.[0];
    const { status, message } = parseSprocResult(response, "No rights to delete");

    return { message: message || "Field detail deleted successfully" };
  } catch (error) {
    console.error("DELETE_FIELD_COMBINED error:", error);
    throw error;
  }
};
