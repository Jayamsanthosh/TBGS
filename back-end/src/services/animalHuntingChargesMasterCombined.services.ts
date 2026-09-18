import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface AnimalHuntingChargesMasterDtl {
  SNO?: number;
  ANIMAL_ID?: number;
  GOVT_RATE?: number;
  ACTUAL_AMOUNT?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

export interface AnimalHuntingChargesMasterData {
  ANIMAL_HUNT_CHARGE_ID?: number;
  COMPANY_ID?: number;
  EFFECTIVE_YEAR?: string;
  ISSUING_AUTHORITY?: string;
  APPROVAL_REFERENCE_NO?: string;
  APPROVAL_DATE?: string;
  EFFECTIVE_FROM?: string;
  EFFECTIVE_TO?: string;
  CURRENCY_ID?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
  REMARKS_HDR?: string;
  STATUS_HDR?: string;
  SNO?: number;
  ANIMAL_ID?: number;
  GOVT_RATE?: number;
  ACTUAL_AMOUNT?: number;
  REMARKS_DTL?: string;
  STATUS_DTL?: string;
  dtls?: AnimalHuntingChargesMasterDtl[];
  deletedIds?: number[];
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

const dateOrNull = (v: any): Date | null => (v ? new Date(v) : null);
const numOrNull = (v: any): number | null =>
  v === undefined || v === null || v === "" ? null : Number(v);

export const getAllAnimalHuntingChargesMasterCombinedService = async () => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const hdrResult = await pool.request().execute("VMaster.SHOW_ANIMAL_HUNTING_CHARGES_MASTER_HDR");

    const dtlResult = await pool.request().query(`
      SELECT
        A.SNO,
        A.ANIMAL_HUNT_CHARGE_ID,
        N.ANIMAL_NAME,
        REPLACE(CONVERT(VARCHAR(50), A.GOVT_RATE, 106), ' ', '-') GOVT_RATE,
        A.ACTUAL_AMOUNT,
        A.REMARKS,
        CASE WHEN A.STATUS_MASTER = 'AC' THEN 'ACTIVE' ELSE 'INACTIVE' END [STATUS_MASTER]
      FROM [VMaster].[TBL_ANIMAL_HUNTING_CHARGES_MASTER_DTL] A
      LEFT JOIN VMaster.TBL_ANIMAL_MASTER N ON A.ANIMAL_ID = N.ANIMAL_ID
    `);

    const hdrs = hdrResult.recordset || [];
    const dtls = dtlResult.recordset || [];

    const hdrMap = new Map<number, any>();
    for (const h of hdrs) {
      hdrMap.set(Number(h.ANIMAL_HUNT_CHARGE_ID), {
        ...h,
        REMARKS_HDR: h.REMARKS,
        STATUS_HDR: h.STATUS_MASTER,
      });
    }

    const combined = dtls.map((dtl: any) => {
      const hdr = hdrMap.get(Number(dtl.ANIMAL_HUNT_CHARGE_ID)) || {};
      return {
        ...hdr,
        ...dtl,
        REMARKS_DTL: dtl.REMARKS,
        STATUS_DTL: dtl.STATUS_MASTER,
      };
    });

    return combined;
  } catch (error) {
    console.error("SHOW_ANIMAL_HUNTING_CHARGES_MASTER_COMBINED error:", error);
    throw error;
  }
};

export const getAnimalHuntingChargesMasterHdrService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("ANIMAL_HUNT_CHARGE_ID", sql.Int, id)
      .execute("VMaster.GET_ANIMAL_HUNTING_CHARGES_MASTER_HDR");

    const row = result.recordset?.[0] || null;
    if (!row) throw new Error("Animal hunting charge header not found");
    return row;
  } catch (error) {
    console.error("GET_ANIMAL_HUNTING_CHARGES_MASTER_HDR error:", error);
    throw error;
  }
};

export const getAnimalHuntingChargesMasterDtlService = async (sno: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, sno)
      .execute("VMaster.GET_ANIMAL_HUNTING_CHARGES_MASTER_DTL");

    const row = result.recordset?.[0] || null;
    if (!row) throw new Error("Animal hunting charge detail not found");
    return row;
  } catch (error) {
    console.error("GET_ANIMAL_HUNTING_CHARGES_MASTER_DTL error:", error);
    throw error;
  }
};

export const saveAnimalHuntingChargesMasterCombinedService = async (data: AnimalHuntingChargesMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const hdrResult = await pool
      .request()
      .input("ANIMAL_HUNT_CHARGE_ID", sql.Int, numOrNull(data.ANIMAL_HUNT_CHARGE_ID) ?? 0)
      .input("COMPANY_ID", sql.Int, numOrNull(data.COMPANY_ID) ?? 0)
      .input("EFFECTIVE_YEAR", sql.VarChar(10), data.EFFECTIVE_YEAR || null)
      .input("ISSUING_AUTHORITY", sql.VarChar(50), data.ISSUING_AUTHORITY || null)
      .input("APPROVAL_REFERENCE_NO", sql.VarChar(50), data.APPROVAL_REFERENCE_NO || null)
      .input("APPROVAL_DATE", sql.DateTime, dateOrNull(data.APPROVAL_DATE))
      .input("EFFECTIVE_FROM", sql.DateTime, dateOrNull(data.EFFECTIVE_FROM))
      .input("EFFECTIVE_TO", sql.DateTime, dateOrNull(data.EFFECTIVE_TO))
      .input("CURRENCY_ID", sql.Int, numOrNull(data.CURRENCY_ID) ?? 0)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS_HDR || data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_HDR || data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_ANIMAL_HUNTING_CHARGES_MASTER_HDR");

    const { status, message, data: hdrData } = parseSprocResult(hdrResult.recordset?.[0], "Failed to save hunting charge header");

    let hdrId = Number(hdrData) || 0;

    if (!hdrId) {
      const maxResult = await pool
        .request()
        .query("SELECT MAX(ANIMAL_HUNT_CHARGE_ID) AS MaxID FROM VMaster.TBL_ANIMAL_HUNTING_CHARGES_MASTER_HDR");
      hdrId = Number(maxResult.recordset?.[0]?.MaxID) || 0;
    }

    if (!hdrId) throw new Error("Could not determine hunting charge header ID");

    const dtls = Array.isArray(data.dtls) ? data.dtls : [];
    for (const dtl of dtls) {
      const dtlResult = await pool
        .request()
        .input("SNO", sql.Int, 0)
        .input("ANIMAL_HUNT_CHARGE_ID", sql.Int, hdrId)
        .input("ANIMAL_ID", sql.Int, numOrNull(dtl.ANIMAL_ID) ?? 0)
        .input("GOVT_RATE", sql.Decimal(15, 2), numOrNull(dtl.GOVT_RATE))
        .input("ACTUAL_AMOUNT", sql.Decimal(15, 2), numOrNull(dtl.ACTUAL_AMOUNT))
        .input("REMARKS", sql.VarChar(1000), dtl.REMARKS || null)
        .input("STATUS_MASTER", sql.VarChar(20), dtl.STATUS_MASTER || null)
        .input("USER", sql.VarChar(50), data.USER || "Admin")
        .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
        .execute("VMaster.SAVE_ANIMAL_HUNTING_CHARGES_MASTER_DTL");

      parseSprocResult(dtlResult.recordset?.[0], "Failed to save hunting charge detail");
    }

    return { message: "Animal hunting charges saved successfully", ANIMAL_HUNT_CHARGE_ID: hdrId };
  } catch (error) {
    console.error("SAVE_ANIMAL_HUNTING_CHARGES_MASTER_COMBINED error:", error);
    throw error;
  }
};

export const updateAnimalHuntingChargesMasterCombinedService = async (data: AnimalHuntingChargesMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const hdrResult = await pool
      .request()
      .input("ANIMAL_HUNT_CHARGE_ID", sql.Int, numOrNull(data.ANIMAL_HUNT_CHARGE_ID) ?? 0)
      .input("COMPANY_ID", sql.Int, numOrNull(data.COMPANY_ID) ?? 0)
      .input("EFFECTIVE_YEAR", sql.VarChar(10), data.EFFECTIVE_YEAR || null)
      .input("ISSUING_AUTHORITY", sql.VarChar(50), data.ISSUING_AUTHORITY || null)
      .input("APPROVAL_REFERENCE_NO", sql.VarChar(50), data.APPROVAL_REFERENCE_NO || null)
      .input("APPROVAL_DATE", sql.DateTime, dateOrNull(data.APPROVAL_DATE))
      .input("EFFECTIVE_FROM", sql.DateTime, dateOrNull(data.EFFECTIVE_FROM))
      .input("EFFECTIVE_TO", sql.DateTime, dateOrNull(data.EFFECTIVE_TO))
      .input("CURRENCY_ID", sql.Int, numOrNull(data.CURRENCY_ID) ?? 0)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS_HDR || data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_HDR || data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.UPDATE_ANIMAL_HUNTING_CHARGES_MASTER_HDR");

    parseSprocResult(hdrResult.recordset?.[0], "Failed to update hunting charge header");

    const dtls = Array.isArray(data.dtls) ? data.dtls : [];
    for (const dtl of dtls) {
      if (dtl.SNO) {
        const dtlResult = await pool
          .request()
          .input("SNO", sql.Int, dtl.SNO)
          .input("ANIMAL_HUNT_CHARGE_ID", sql.Int, numOrNull(data.ANIMAL_HUNT_CHARGE_ID) ?? 0)
          .input("ANIMAL_ID", sql.Int, numOrNull(dtl.ANIMAL_ID) ?? 0)
          .input("GOVT_RATE", sql.Decimal(15, 2), numOrNull(dtl.GOVT_RATE))
          .input("ACTUAL_AMOUNT", sql.Decimal(15, 2), numOrNull(dtl.ACTUAL_AMOUNT))
          .input("REMARKS", sql.VarChar(1000), dtl.REMARKS || null)
          .input("STATUS_MASTER", sql.VarChar(20), dtl.STATUS_MASTER || null)
          .input("USER", sql.VarChar(50), data.USER ?? "Admin")
          .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
          .execute("VMaster.UPDATE_ANIMAL_HUNTING_CHARGES_MASTER_DTL");

        parseSprocResult(dtlResult.recordset?.[0], "Failed to update hunting charge detail");
      } else {
        const dtlResult = await pool
          .request()
          .input("SNO", sql.Int, 0)
          .input("ANIMAL_HUNT_CHARGE_ID", sql.Int, numOrNull(data.ANIMAL_HUNT_CHARGE_ID) ?? 0)
          .input("ANIMAL_ID", sql.Int, numOrNull(dtl.ANIMAL_ID) ?? 0)
          .input("GOVT_RATE", sql.Decimal(15, 2), numOrNull(dtl.GOVT_RATE))
          .input("ACTUAL_AMOUNT", sql.Decimal(15, 2), numOrNull(dtl.ACTUAL_AMOUNT))
          .input("REMARKS", sql.VarChar(1000), dtl.REMARKS || null)
          .input("STATUS_MASTER", sql.VarChar(20), dtl.STATUS_MASTER || null)
          .input("USER", sql.VarChar(50), data.USER ?? "Admin")
          .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
          .execute("VMaster.SAVE_ANIMAL_HUNTING_CHARGES_MASTER_DTL");

        parseSprocResult(dtlResult.recordset?.[0], "Failed to save hunting charge detail");
      }
    }

    const deletedIds = Array.isArray(data.deletedIds) ? data.deletedIds : [];
    for (const sno of deletedIds) {
      await deleteAnimalHuntingChargesMasterDtlService(sno, data.USER || "Admin", data.ROLE || "Admin", data.MAC_ADDRESS || "WEB");
    }

    return { message: "Animal hunting charges updated successfully" };
  } catch (error) {
    console.error("UPDATE_ANIMAL_HUNTING_CHARGES_MASTER_COMBINED error:", error);
    throw error;
  }
};

export const deleteAnimalHuntingChargesMasterDtlService = async (
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
      .execute("VMaster.DELETE_ANIMAL_HUNTING_CHARGES_MASTER_DTL");

    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete hunting charge detail");

    return { message: message || "Hunting charge detail deleted successfully" };
  } catch (error) {
    console.error("DELETE_ANIMAL_HUNTING_CHARGES_MASTER_DTL error:", error);
    throw error;
  }
};

export const deleteAnimalHuntingChargesMasterHdrService = async (
  id: number,
  user = "Admin",
  role = "Admin",
  macAddress = "WEB"
) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("ANIMAL_HUNT_CHARGE_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user)
      .input("ROLE", sql.VarChar(50), role)
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress)
      .execute("VMaster.DELETE_ANIMAL_HUNTING_CHARGES_MASTER_HDR");

    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete hunting charge header");

    return { message: message || "Hunting charge header deleted successfully" };
  } catch (error) {
    console.error("DELETE_ANIMAL_HUNTING_CHARGES_MASTER_HDR error:", error);
    throw error;
  }
};
