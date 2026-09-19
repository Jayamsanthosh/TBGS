import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface CompanyQuotaAnimalMappingDtl {
  SNO?: number;
  ANIMAL_ID?: number;
  OLD_APPROVED_QTY?: number;
  ADD_REMOVE_QTY?: number;
  NEW_APPROVED_QTY?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

export interface CompanyQuotaAnimalMappingData {
  QUOTA_ID?: number;
  COMPANY_ID?: number;
  CAMP_ID?: number;
  EFFECTIVE_YEAR?: string;
  NEW_REVISION?: string;
  OLD_QUOTA_ID?: number;
  ISSUING_AUTHORITY?: string;
  APPROVAL_REFERENCE_NO?: string;
  APPROVAL_DATE?: string;
  LAST_AMENDMENT_DATE?: string;
  EFFECTIVE_FROM?: string;
  EFFECTIVE_TO?: string;
  QUOTA_AMOUNT?: number;
  VAT_AMOUNT?: number;
  FINAL_QUOTA_AMOUNT?: number;
  CURRENCY_ID?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
  REMARKS_HDR?: string;
  STATUS_HDR?: string;
  REMARKS_DTL?: string;
  STATUS_DTL?: string;
  SNO?: number;
  ANIMAL_ID?: number;
  OLD_APPROVED_QTY?: number;
  ADD_REMOVE_QTY?: number;
  NEW_APPROVED_QTY?: number;
  dtls?: CompanyQuotaAnimalMappingDtl[];
  deletedIds?: number[];
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const dateOrNull = (v: any): Date | null => (v ? new Date(v) : null);
const numOrNull = (v: any): number | null =>
  v === undefined || v === null || v === "" ? null : Number(v);

export const getAllCompanyQuotaAnimalMappingCombinedService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const [hdrResult, dtlResult] = await Promise.all([
      pool.request().execute("VMaster.SHOW_COMPANY_QUOTA_ANIMAL_MAPPING_HDR"),
      pool.request().execute("VMaster.SHOW_COMPANY_QUOTA_ANIMAL_MAPPING_DTL")
    ]);

    const hdrs = hdrResult.recordset || [];
    const dtls = dtlResult.recordset || [];

    const hdrMap = new Map<number, any>();
    for (const h of hdrs) {
      hdrMap.set(Number(h.QUOTA_ID), {
        ...h,
        REMARKS_QUOTA_HDR: h.REMARKS,
        STATUS_QUOTA_HDR: h.STATUS_MASTER,
      });
    }

    const combined = dtls.map((dtl: any) => {
      const hdr = hdrMap.get(Number(dtl.QUOTA_ID)) || {};
      return {
        ...hdr,
        ...dtl,
        REMARKS_QUOTA_DTL: dtl.REMARKS,
        STATUS_QUOTA_DTL: dtl.STATUS_MASTER,
      };
    });

    return combined;
  } catch (error) {
    console.error("SHOW_COMPANY_QUOTA_ANIMAL_MAPPING_COMBINED error:", error);
    throw error;
  }
};

export const getCompanyQuotaAnimalMappingHdrService = async (quotaId: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("QUOTA_ID", sql.Int, quotaId)
      .execute("VMaster.GET_COMPANY_QUOTA_ANIMAL_MAPPING_HDR");

    const row = result.recordset?.[0] || null;
    if (!row) throw new Error("Quota header not found");
    return row;
  } catch (error) {
    console.error("GET_COMPANY_QUOTA_ANIMAL_MAPPING_HDR error:", error);
    throw error;
  }
};

export const getCompanyQuotaAnimalMappingDtlService = async (sno: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, sno)
      .execute("VMaster.GET_COMPANY_QUOTA_ANIMAL_MAPPING_DTL");

    const row = result.recordset?.[0] || null;
    if (!row) throw new Error("Quota animal detail not found");
    return row;
  } catch (error) {
    console.error("GET_COMPANY_QUOTA_ANIMAL_MAPPING_DTL error:", error);
    throw error;
  }
};

export const saveCompanyQuotaAnimalMappingCombinedService = async (data: CompanyQuotaAnimalMappingData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const hdrResult = await pool
      .request()
      .input("QUOTA_ID", sql.Int, numOrNull(data.QUOTA_ID) ?? 0)
      .input("COMPANY_ID", sql.Int, numOrNull(data.COMPANY_ID) ?? 0)
      .input("CAMP_ID", sql.Int, numOrNull(data.CAMP_ID) ?? 0)
      .input("EFFECTIVE_YEAR", sql.VarChar(10), data.EFFECTIVE_YEAR || null)
      .input("NEW_REVISION", sql.VarChar(50), data.NEW_REVISION || null)
      .input("OLD_QUOTA_ID", sql.Int, numOrNull(data.OLD_QUOTA_ID) ?? 0)
      .input("ISSUING_AUTHORITY", sql.VarChar(50), data.ISSUING_AUTHORITY || null)
      .input("APPROVAL_REFERENCE_NO", sql.VarChar(50), data.APPROVAL_REFERENCE_NO || null)
      .input("APPROVAL_DATE", sql.DateTime, dateOrNull(data.APPROVAL_DATE))
      .input("LAST_AMENDMENT_DATE", sql.DateTime, dateOrNull(data.LAST_AMENDMENT_DATE))
      .input("EFFECTIVE_FROM", sql.DateTime, dateOrNull(data.EFFECTIVE_FROM))
      .input("EFFECTIVE_TO", sql.DateTime, dateOrNull(data.EFFECTIVE_TO))
      .input("QUOTA_AMOUNT", sql.Decimal(15, 2), numOrNull(data.QUOTA_AMOUNT))
      .input("VAT_AMOUNT", sql.Decimal(15, 2), numOrNull(data.VAT_AMOUNT))
      .input("FINAL_QUOTA_AMOUNT", sql.Decimal(15, 2), numOrNull(data.FINAL_QUOTA_AMOUNT))
      .input("CURRENCY_ID", sql.Int, numOrNull(data.CURRENCY_ID) ?? 0)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS_HDR || data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_HDR || data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_COMPANY_QUOTA_ANIMAL_MAPPING_HDR");

    const { status, message, data: parsedData } = parseSprocResult(hdrResult.recordset?.[0], "Failed to save quota header");

    const quotaId = parsedData;
    if (!quotaId) throw new Error("Could not determine quota header ID");

    const dtls = Array.isArray(data.dtls) ? data.dtls : [];
    for (const dtl of dtls) {
      const dtlResult = await pool
        .request()
        .input("SNO", sql.Int, 0)
        .input("QUOTA_ID", sql.Int, quotaId)
        .input("ANIMAL_ID", sql.Int, numOrNull(dtl.ANIMAL_ID) ?? 0)
        .input("OLD_APPROVED_QTY", sql.Int, numOrNull(dtl.OLD_APPROVED_QTY) ?? 0)
        .input("ADD_REMOVE_QTY", sql.Int, numOrNull(dtl.ADD_REMOVE_QTY) ?? 0)
        .input("NEW_APPROVED_QTY", sql.Int, numOrNull(dtl.NEW_APPROVED_QTY) ?? 0)
        .input("REMARKS", sql.VarChar(1000), dtl.REMARKS || null)
        .input("STATUS_MASTER", sql.VarChar(20), dtl.STATUS_MASTER || null)
        .input("USER", sql.VarChar(50), data.USER || "Admin")
        .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
        .execute("VMaster.SAVE_COMPANY_QUOTA_ANIMAL_MAPPING_DTL");

      parseSprocResult(dtlResult.recordset?.[0], "Failed to save quota animal detail");
    }

    return { message: "Company quota animal mapping saved successfully", QUOTA_ID: quotaId };
  } catch (error) {
    console.error("SAVE_COMPANY_QUOTA_ANIMAL_MAPPING_COMBINED error:", error);
    throw error;
  }
};

export const updateCompanyQuotaAnimalMappingCombinedService = async (data: CompanyQuotaAnimalMappingData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const hdrResult = await pool
      .request()
      .input("QUOTA_ID", sql.Int, numOrNull(data.QUOTA_ID) ?? 0)
      .input("COMPANY_ID", sql.Int, numOrNull(data.COMPANY_ID) ?? 0)
      .input("CAMP_ID", sql.Int, numOrNull(data.CAMP_ID) ?? 0)
      .input("EFFECTIVE_YEAR", sql.VarChar(10), data.EFFECTIVE_YEAR || null)
      .input("NEW_REVISION", sql.VarChar(50), data.NEW_REVISION || null)
      .input("OLD_QUOTA_ID", sql.Int, numOrNull(data.OLD_QUOTA_ID) ?? 0)
      .input("ISSUING_AUTHORITY", sql.VarChar(50), data.ISSUING_AUTHORITY || null)
      .input("APPROVAL_REFERENCE_NO", sql.VarChar(50), data.APPROVAL_REFERENCE_NO || null)
      .input("APPROVAL_DATE", sql.DateTime, dateOrNull(data.APPROVAL_DATE))
      .input("LAST_AMENDMENT_DATE", sql.DateTime, dateOrNull(data.LAST_AMENDMENT_DATE))
      .input("EFFECTIVE_FROM", sql.DateTime, dateOrNull(data.EFFECTIVE_FROM))
      .input("EFFECTIVE_TO", sql.DateTime, dateOrNull(data.EFFECTIVE_TO))
      .input("QUOTA_AMOUNT", sql.Decimal(15, 2), numOrNull(data.QUOTA_AMOUNT))
      .input("VAT_AMOUNT", sql.Decimal(15, 2), numOrNull(data.VAT_AMOUNT))
      .input("FINAL_QUOTA_AMOUNT", sql.Decimal(15, 2), numOrNull(data.FINAL_QUOTA_AMOUNT))
      .input("CURRENCY_ID", sql.Int, numOrNull(data.CURRENCY_ID) ?? 0)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS_HDR || data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_HDR || data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.UPDATE_COMPANY_QUOTA_ANIMAL_MAPPING_HDR");

    const { status, message } = parseSprocResult(hdrResult.recordset?.[0], "Failed to update quota header");

    const dtls = Array.isArray(data.dtls) ? data.dtls : [];
    for (const dtl of dtls) {
      if (dtl.SNO) {
        const dtlResult = await pool
          .request()
          .input("SNO", sql.Int, dtl.SNO)
          .input("QUOTA_ID", sql.Int, numOrNull(data.QUOTA_ID) ?? 0)
          .input("ANIMAL_ID", sql.Int, numOrNull(dtl.ANIMAL_ID) ?? 0)
          .input("OLD_APPROVED_QTY", sql.Int, numOrNull(dtl.OLD_APPROVED_QTY) ?? 0)
          .input("ADD_REMOVE_QTY", sql.Int, numOrNull(dtl.ADD_REMOVE_QTY) ?? 0)
          .input("NEW_APPROVED_QTY", sql.Int, numOrNull(dtl.NEW_APPROVED_QTY) ?? 0)
          .input("REMARKS", sql.VarChar(1000), dtl.REMARKS || null)
          .input("STATUS_MASTER", sql.VarChar(20), dtl.STATUS_MASTER || null)
          .input("USER", sql.VarChar(50), data.USER ?? "Admin")
          .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
          .execute("VMaster.UPDATE_COMPANY_QUOTA_ANIMAL_MAPPING_DTL");

        parseSprocResult(dtlResult.recordset?.[0], "Failed to update quota animal detail");
      } else {
        const dtlResult = await pool
          .request()
          .input("SNO", sql.Int, 0)
          .input("QUOTA_ID", sql.Int, numOrNull(data.QUOTA_ID) ?? 0)
          .input("ANIMAL_ID", sql.Int, numOrNull(dtl.ANIMAL_ID) ?? 0)
          .input("OLD_APPROVED_QTY", sql.Int, numOrNull(dtl.OLD_APPROVED_QTY) ?? 0)
          .input("ADD_REMOVE_QTY", sql.Int, numOrNull(dtl.ADD_REMOVE_QTY) ?? 0)
          .input("NEW_APPROVED_QTY", sql.Int, numOrNull(dtl.NEW_APPROVED_QTY) ?? 0)
          .input("REMARKS", sql.VarChar(1000), dtl.REMARKS || null)
          .input("STATUS_MASTER", sql.VarChar(20), dtl.STATUS_MASTER || null)
          .input("USER", sql.VarChar(50), data.USER ?? "Admin")
          .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
          .execute("VMaster.SAVE_COMPANY_QUOTA_ANIMAL_MAPPING_DTL");

        parseSprocResult(dtlResult.recordset?.[0], "Failed to save quota animal detail");
        }
    }

    const deletedIds = Array.isArray(data.deletedIds) ? data.deletedIds : [];
    for (const sno of deletedIds) {
      await deleteCompanyQuotaAnimalMappingDtlService(sno, data.USER || "Admin", data.ROLE || "Admin", data.MAC_ADDRESS || "WEB");
    }

    return { message: "Company quota animal mapping updated successfully" };
  } catch (error) {
    console.error("UPDATE_COMPANY_QUOTA_ANIMAL_MAPPING_COMBINED error:", error);
    throw error;
  }
};

export const deleteCompanyQuotaAnimalMappingDtlService = async (
  sno: number,
  user = "Admin",
  role = "Admin",
  macAddress = "WEB"
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, sno)
      .input("USER", sql.VarChar(50), user)
      .input("ROLE", sql.VarChar(50), role)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VMaster.DELETE_COMPANY_QUOTA_ANIMAL_MAPPING_DTL");

    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete quota animal detail");

    return { message: message || "Quota animal detail deleted successfully" };
  } catch (error) {
    console.error("DELETE_COMPANY_QUOTA_ANIMAL_MAPPING_DTL error:", error);
    throw error;
  }
};

export const deleteCompanyQuotaAnimalMappingHdrService = async (
  quotaId: number,
  user = "Admin",
  role = "Admin",
  macAddress = "WEB"
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("QUOTA_ID", sql.Int, quotaId)
      .input("USER", sql.VarChar(50), user)
      .input("ROLE", sql.VarChar(50), role)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VMaster.DELETE_COMPANY_QUOTA_ANIMAL_MAPPING_HDR");

    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete quota header");

    return { message: message || "Quota header deleted successfully" };
  } catch (error) {
    console.error("DELETE_COMPANY_QUOTA_ANIMAL_MAPPING_HDR error:", error);
    throw error;
  }
};
