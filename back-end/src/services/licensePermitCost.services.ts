import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface LicensePermitCostData {
  SNO?: number;
  LICENSE_PERMIT_ID?: number;
  SALES_PACKAGE_TYPE_ID?: number;
  PRICE_TYPE_ID?: number;
  PRICE_PACKAGE_ID?: number;
  GOVT_RATE?: number;
  ACTUAL_AMOUNT?: number;
  CURRENCY_ID?: number;
  EFFECTIVE_FROM?: string;
  EFFECTIVE_TO?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllLicensePermitCostService = async (status?: string) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const query = `
    SELECT
       a.[SNO]
      ,a.[LICENSE_PERMIT_ID]
      ,lt.LICENSE_PERMIT_NAME
      ,a.[SALES_PACKAGE_TYPE_ID]
      ,st.SALES_PACKAGE_TYPE_NAME
      ,a.[PRICE_TYPE_ID]
      ,pt.PRICE_TYPE_NAME
      ,a.[PRICE_PACKAGE_ID]
      ,p.PRICE_PACKAGE_NAME
      ,a.[GOVT_RATE]
      ,a.[ACTUAL_AMOUNT]
      ,a.[CURRENCY_ID]
      ,cu.CURRENCY_NAME
      ,REPLACE(CONVERT(VARCHAR(50), a.EFFECTIVE_FROM, 106), ' ', '-') AS EFFECTIVE_FROM
      ,REPLACE(CONVERT(VARCHAR(50), a.EFFECTIVE_TO, 106), ' ', '-')   AS EFFECTIVE_TO
      ,a.[REMARKS]
      ,CASE WHEN a.STATUS_MASTER IN ('AC','ACTIVE') THEN 'ACTIVE' ELSE 'INACTIVE' END AS STATUS_MASTER
    FROM [VMaster].[TBL_LICENSE_PERMIT_COST_MASTER] AS a
    LEFT JOIN VMASTER.TBL_LICENSE_PERMIT_TYPE_MASTER  AS lt ON lt.LICENSE_PERMIT_ID  = a.LICENSE_PERMIT_ID
    LEFT JOIN VMASTER.TBL_SALES_PACKAGE_TYPE_MASTER   AS st ON st.SALES_PACKAGE_TYPE_ID = a.SALES_PACKAGE_TYPE_ID
    LEFT JOIN VMASTER.TBL_PRICE_TYPE_MASTER           AS pt ON pt.PRICE_TYPE_ID       = a.PRICE_TYPE_ID
    LEFT JOIN VMASTER.TBL_PRICE_PACKAGE_MASTER        AS p  ON p.PRICE_PACKAGE_ID     = a.PRICE_PACKAGE_ID
    LEFT JOIN VMASTER.TBL_CURRENCY_MASTER             AS cu ON cu.CURRENCY_ID         = a.CURRENCY_ID
    WHERE (@STATUS = '' OR @STATUS IS NULL
       OR UPPER(a.STATUS_MASTER) = @STATUS
       OR (UPPER(a.STATUS_MASTER) = 'ACTIVE'   AND @STATUS = 'AC')
       OR (UPPER(a.STATUS_MASTER) = 'INACTIVE' AND @STATUS = 'IN'))
    ORDER BY a.SNO
  `;

  try {
    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(50), status ?? "AC")
      .query(query);
    return result.recordset || [];
  } catch (error) {
    console.error("SHOW_LICENSE_PERMIT_COST_MASTER query error:", error);
    throw error;
  }
};

export const getLicensePermitCostByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, id)
      .execute("VMaster.GET_LICENSE_PERMIT_COST_MASTER");
    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_LICENSE_PERMIT_COST_MASTER SP error:", error);
    throw error;
  }
};

export const saveLicensePermitCostService = async (data: LicensePermitCostData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, data.SNO ?? 0)
      .input("LICENSE_PERMIT_ID", sql.Int, data.LICENSE_PERMIT_ID ?? null)
      .input("SALES_PACKAGE_TYPE_ID", sql.Int, data.SALES_PACKAGE_TYPE_ID ?? null)
      .input("PRICE_TYPE_ID", sql.Int, data.PRICE_TYPE_ID ?? null)
      .input("PRICE_PACKAGE_ID", sql.Int, data.PRICE_PACKAGE_ID ?? null)
      .input("GOVT_RATE", sql.Decimal(15, 2), data.GOVT_RATE ?? null)
      .input("ACTUAL_AMOUNT", sql.Decimal(15, 2), data.ACTUAL_AMOUNT ?? null)
      .input("CURRENCY_ID", sql.Int, data.CURRENCY_ID ?? null)
      .input("EFFECTIVE_FROM", sql.DateTime, data.EFFECTIVE_FROM || null)
      .input("EFFECTIVE_TO", sql.DateTime, data.EFFECTIVE_TO || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_LICENSE_PERMIT_COST_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to save license permit cost");

    return { message: message || "License permit cost saved successfully" };
  } catch (error) {
    console.error("SAVE_LICENSE_PERMIT_COST_MASTER SP error:", error);
    throw error;
  }
};

export const updateLicensePermitCostService = async (data: LicensePermitCostData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("SNO", sql.Int, data.SNO ?? 0)
      .input("LICENSE_PERMIT_ID", sql.Int, data.LICENSE_PERMIT_ID ?? null)
      .input("SALES_PACKAGE_TYPE_ID", sql.Int, data.SALES_PACKAGE_TYPE_ID ?? null)
      .input("PRICE_TYPE_ID", sql.Int, data.PRICE_TYPE_ID ?? null)
      .input("PRICE_PACKAGE_ID", sql.Int, data.PRICE_PACKAGE_ID ?? null)
      .input("GOVT_RATE", sql.Decimal(15, 2), data.GOVT_RATE ?? null)
      .input("ACTUAL_AMOUNT", sql.Decimal(15, 2), data.ACTUAL_AMOUNT ?? null)
      .input("CURRENCY_ID", sql.Int, data.CURRENCY_ID ?? null)
      .input("EFFECTIVE_FROM", sql.DateTime, data.EFFECTIVE_FROM || null)
      .input("EFFECTIVE_TO", sql.DateTime, data.EFFECTIVE_TO || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.UPDATE_LICENSE_PERMIT_COST_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update license permit cost");

    return { message: message || "License permit cost updated successfully" };
  } catch (error) {
    console.error("UPDATE_LICENSE_PERMIT_COST_MASTER SP error:", error);
    throw error;
  }
};

export const deleteLicensePermitCostService = async (
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
      .input("SNO", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_LICENSE_PERMIT_COST_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "No rights to delete");

    return { message: message || "License permit cost deleted successfully" };
  } catch (error) {
    console.error("DELETE_LICENSE_PERMIT_COST_MASTER SP error:", error);
    throw error;
  }
};
