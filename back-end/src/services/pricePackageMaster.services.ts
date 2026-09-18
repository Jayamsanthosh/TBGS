import sql from "mssql";
import { getPool } from "../config/db";

export interface PricePackageMasterData {
  PRICE_PACKAGE_ID?: number;
  PRICE_PACKAGE_TYPE?: string;
  PRICE_PACKAGE_NAME: string;
  PRICE_PACKAGE_DAYS?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllPricePackageMasterService = async () => {
  const pool = getPool();

  try {
    const result = await pool.request().query(`
      SELECT PRICE_PACKAGE_ID, PRICE_PACKAGE_TYPE, PRICE_PACKAGE_NAME,
             PRICE_PACKAGE_DAYS, REMARKS, STATUS_MASTER
      FROM [VMaster].[TBL_PRICE_PACKAGE_MASTER]
      ORDER BY PRICE_PACKAGE_NAME
    `);
    return result.recordset || [];
  } catch (error) {
    console.error("getAllPricePackageMaster error:", error);
    throw error;
  }
};

export const getPricePackageMasterByIdService = async (id: number) => {
  const pool = getPool();

  try {
    const result = await pool
      .request()
      .input("PRICE_PACKAGE_ID", sql.Int, id)
      .query(`
        SELECT PRICE_PACKAGE_ID, PRICE_PACKAGE_TYPE, PRICE_PACKAGE_NAME,
               PRICE_PACKAGE_DAYS, REMARKS, STATUS_MASTER, CREATED_BY
        FROM [VMaster].[TBL_PRICE_PACKAGE_MASTER]
        WHERE PRICE_PACKAGE_ID = @PRICE_PACKAGE_ID
      `);

    return result.recordset[0] || null;
  } catch (error) {
    console.error("getPricePackageMasterById error:", error);
    throw error;
  }
};

export const savePricePackageMasterService = async (data: PricePackageMasterData) => {
  const pool = getPool();

  try {
    const duplicateCheck = await pool
      .request()
      .input("PRICE_PACKAGE_NAME", sql.VarChar(50), data.PRICE_PACKAGE_NAME)
      .query(`
        SELECT 1 FROM [VMaster].[TBL_PRICE_PACKAGE_MASTER]
        WHERE UPPER(PRICE_PACKAGE_NAME) = UPPER(@PRICE_PACKAGE_NAME)
      `);

    if (duplicateCheck.recordset.length > 0) {
      throw new Error("Price Package Name Already Exists");
    }

    await pool
      .request()
      .input("PRICE_PACKAGE_TYPE", sql.VarChar(50), data.PRICE_PACKAGE_TYPE || null)
      .input("PRICE_PACKAGE_NAME", sql.VarChar(50), data.PRICE_PACKAGE_NAME)
      .input("PRICE_PACKAGE_DAYS", sql.Int, data.PRICE_PACKAGE_DAYS ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .query(`
        INSERT INTO [VMaster].[TBL_PRICE_PACKAGE_MASTER]
        (PRICE_PACKAGE_TYPE, PRICE_PACKAGE_NAME, PRICE_PACKAGE_DAYS, REMARKS,
         STATUS_MASTER, CREATED_BY, CREATED_DATE, CREATED_MAC_ADDRESS,
         MODIFIED_BY, MODIFIED_DATE, MODIFIED_MAC_ADDRESS)
        VALUES
        (@PRICE_PACKAGE_TYPE, @PRICE_PACKAGE_NAME, @PRICE_PACKAGE_DAYS, @REMARKS,
         @STATUS_MASTER, @USER, GETDATE(), @MAC_ADDRESS,
         @USER, GETDATE(), @MAC_ADDRESS)
      `);

    return { message: "Data Saved Successfully" };
  } catch (error) {
    console.error("savePricePackageMaster error:", error);
    throw error;
  }
};

export const updatePricePackageMasterService = async (data: PricePackageMasterData) => {
  const pool = getPool();

  try {
    const duplicateCheck = await pool
      .request()
      .input("PRICE_PACKAGE_NAME", sql.VarChar(50), data.PRICE_PACKAGE_NAME)
      .input("PRICE_PACKAGE_ID", sql.Int, data.PRICE_PACKAGE_ID ?? 0)
      .query(`
        SELECT 1 FROM [VMaster].[TBL_PRICE_PACKAGE_MASTER]
        WHERE UPPER(PRICE_PACKAGE_NAME) = UPPER(@PRICE_PACKAGE_NAME)
        AND PRICE_PACKAGE_ID <> @PRICE_PACKAGE_ID
      `);

    if (duplicateCheck.recordset.length > 0) {
      throw new Error("Price Package Name Already Exists");
    }

    await pool
      .request()
      .input("PRICE_PACKAGE_ID", sql.Int, data.PRICE_PACKAGE_ID ?? 0)
      .input("PRICE_PACKAGE_TYPE", sql.VarChar(50), data.PRICE_PACKAGE_TYPE ?? null)
      .input("PRICE_PACKAGE_NAME", sql.VarChar(50), data.PRICE_PACKAGE_NAME ?? null)
      .input("PRICE_PACKAGE_DAYS", sql.Int, data.PRICE_PACKAGE_DAYS ?? null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .query(`
        UPDATE [VMaster].[TBL_PRICE_PACKAGE_MASTER]
        SET PRICE_PACKAGE_TYPE = @PRICE_PACKAGE_TYPE,
            PRICE_PACKAGE_NAME = @PRICE_PACKAGE_NAME,
            PRICE_PACKAGE_DAYS = @PRICE_PACKAGE_DAYS,
            REMARKS = @REMARKS,
            STATUS_MASTER = @STATUS_MASTER,
            MODIFIED_BY = @USER,
            MODIFIED_DATE = GETDATE(),
            MODIFIED_MAC_ADDRESS = @MAC_ADDRESS
        WHERE PRICE_PACKAGE_ID = @PRICE_PACKAGE_ID
      `);

    return { message: "Record Updated Successfully" };
  } catch (error) {
    console.error("updatePricePackageMaster error:", error);
    throw error;
  }
};

export const deletePricePackageMasterService = async (
  id: number,
  user: string,
  role: string,
  macAddress: string
) => {
  const pool = getPool();

  try {
    if (role !== "Admin") {
      throw new Error("No Rights To Delete");
    }

    const existsCheck = await pool
      .request()
      .input("PRICE_PACKAGE_ID", sql.Int, id)
      .query(`
        SELECT 1 FROM [VMaster].[TBL_PRICE_PACKAGE_MASTER]
        WHERE PRICE_PACKAGE_ID = @PRICE_PACKAGE_ID
      `);

    if (existsCheck.recordset.length === 0) {
      throw new Error("Record Not Found");
    }

    await pool
      .request()
      .input("PRICE_PACKAGE_ID", sql.Int, id)
      .query(`
        DELETE FROM [VMaster].[TBL_PRICE_PACKAGE_MASTER]
        WHERE PRICE_PACKAGE_ID = @PRICE_PACKAGE_ID
      `);

    return { message: "Data Deleted Successfully" };
  } catch (error) {
    console.error("deletePricePackageMaster error:", error);
    throw error;
  }
};
