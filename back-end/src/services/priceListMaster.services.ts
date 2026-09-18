import sql from "mssql";
import { getPool } from "../config/db";

export interface PriceListMasterData {
  PRICE_LIST_ID?: number;
  PRICE_TYPE_ID?: number;
  COMPANY_ID?: number;
  PRICE_PACKAGE_ID?: number;
  PER_DAY_OR_TRIP_OR_QTY_PRICE?: number;
  FOOD_LIMIT_AMOUNT?: number;
  DRINKS_LIMIT_AMOUNT?: number;
  ACCOMDATION_LIMIT_AMOUNT?: number;
  CURRENCY_ID?: number;
  EFFECTIVE_FROM?: string;
  EFFECTIVE_TO?: string;
  REQUESTED_BY?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export const getAllPriceListMasterService = async () => {
  const pool = getPool();

  try {
    const result = await pool.request().query(`
      SELECT
        A.PRICE_LIST_ID,
        A.PRICE_TYPE_ID,        T.PRICE_TYPE_NAME,
        A.COMPANY_ID,           C.COMPANY_NAME,
        A.PRICE_PACKAGE_ID,     P.PRICE_PACKAGE_NAME,
        A.CURRENCY_ID,          CU.CURRENCY_NAME,
        A.PER_DAY_OR_TRIP_OR_QTY_PRICE,
        A.FOOD_LIMIT_AMOUNT,
        A.DRINKS_LIMIT_AMOUNT,
        A.ACCOMDATION_LIMIT_AMOUNT,
        A.EFFECTIVE_FROM,
        A.EFFECTIVE_TO,
        A.REMARKS,
        A.STATUS_MASTER
      FROM [VMaster].[TBL_PRICE_LIST_MASTER] A
      INNER JOIN [VMaster].[TBL_COMPANY_MASTER] C ON A.COMPANY_ID = C.COMPANY_ID
      INNER JOIN [VMaster].[TBL_PRICE_PACKAGE_MASTER] P ON A.PRICE_PACKAGE_ID = P.PRICE_PACKAGE_ID
      LEFT JOIN [VMaster].[TBL_PRICE_TYPE_MASTER] T ON A.PRICE_TYPE_ID = T.PRICE_TYPE_ID
      LEFT JOIN [VMaster].[TBL_CURRENCY_MASTER] CU ON A.CURRENCY_ID = CU.CURRENCY_ID
      ORDER BY A.PRICE_LIST_ID
    `);
    return result.recordset || [];
  } catch (error) {
    console.error("getAllPriceListMaster error:", error);
    throw error;
  }
};

export const getPriceListMasterByIdService = async (id: number) => {
  const pool = getPool();

  try {
    const result = await pool
      .request()
      .input("PRICE_LIST_ID", sql.Int, id)
      .query(`
        SELECT * FROM [VMaster].[TBL_PRICE_LIST_MASTER]
        WHERE PRICE_LIST_ID = @PRICE_LIST_ID
      `);

    return result.recordset[0] || null;
  } catch (error) {
    console.error("getPriceListMasterById error:", error);
    throw error;
  }
};

export const savePriceListMasterService = async (data: PriceListMasterData) => {
  const pool = getPool();

  try {
    const duplicateCheck = await pool
      .request()
      .input("COMPANY_ID", sql.Int, data.COMPANY_ID ?? 0)
      .input("PRICE_TYPE_ID", sql.Int, data.PRICE_TYPE_ID ?? 0)
      .query(`
        SELECT 1 FROM [VMaster].[TBL_PRICE_LIST_MASTER]
        WHERE COMPANY_ID = @COMPANY_ID AND PRICE_TYPE_ID = @PRICE_TYPE_ID
      `);

    if (duplicateCheck.recordset.length > 0) {
      throw new Error("Price List Already Exists");
    }

    await pool
      .request()
      .input("PRICE_TYPE_ID", sql.Int, data.PRICE_TYPE_ID ?? null)
      .input("COMPANY_ID", sql.Int, data.COMPANY_ID ?? null)
      .input("PRICE_PACKAGE_ID", sql.Int, data.PRICE_PACKAGE_ID ?? null)
      .input("PER_DAY_OR_TRIP_OR_QTY_PRICE", sql.Decimal(15, 2), data.PER_DAY_OR_TRIP_OR_QTY_PRICE ?? null)
      .input("FOOD_LIMIT_AMOUNT", sql.Decimal(15, 2), data.FOOD_LIMIT_AMOUNT ?? null)
      .input("DRINKS_LIMIT_AMOUNT", sql.Decimal(15, 2), data.DRINKS_LIMIT_AMOUNT ?? null)
      .input("ACCOMDATION_LIMIT_AMOUNT", sql.Decimal(15, 2), data.ACCOMDATION_LIMIT_AMOUNT ?? null)
      .input("CURRENCY_ID", sql.Int, data.CURRENCY_ID ?? null)
      .input("EFFECTIVE_FROM", sql.DateTime, data.EFFECTIVE_FROM || null)
      .input("EFFECTIVE_TO", sql.DateTime, data.EFFECTIVE_TO || null)
      .input("REQUESTED_BY", sql.VarChar(50), data.REQUESTED_BY || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .query(`
        INSERT INTO [VMaster].[TBL_PRICE_LIST_MASTER]
        (PRICE_TYPE_ID, COMPANY_ID, PRICE_PACKAGE_ID,
         PER_DAY_OR_TRIP_OR_QTY_PRICE, FOOD_LIMIT_AMOUNT, DRINKS_LIMIT_AMOUNT, ACCOMDATION_LIMIT_AMOUNT,
         CURRENCY_ID, EFFECTIVE_FROM, EFFECTIVE_TO,
         REQUESTED_BY, REQUESTED_DATE,
         REMARKS, STATUS_MASTER,
         CREATED_BY, CREATED_DATE, CREATED_MAC_ADDRESS,
         MODIFIED_BY, MODIFIED_DATE, MODIFIED_MAC_ADDRESS)
        VALUES
        (@PRICE_TYPE_ID, @COMPANY_ID, @PRICE_PACKAGE_ID,
         @PER_DAY_OR_TRIP_OR_QTY_PRICE, @FOOD_LIMIT_AMOUNT, @DRINKS_LIMIT_AMOUNT, @ACCOMDATION_LIMIT_AMOUNT,
         @CURRENCY_ID, @EFFECTIVE_FROM, @EFFECTIVE_TO,
         @REQUESTED_BY, GETDATE(),
         @REMARKS, @STATUS_MASTER,
         @USER, GETDATE(), @MAC_ADDRESS,
         @USER, GETDATE(), @MAC_ADDRESS)
      `);

    return { message: "Data Saved Successfully" };
  } catch (error) {
    console.error("savePriceListMaster error:", error);
    throw error;
  }
};

export const updatePriceListMasterService = async (data: PriceListMasterData) => {
  const pool = getPool();

  try {
    const duplicateCheck = await pool
      .request()
      .input("COMPANY_ID", sql.Int, data.COMPANY_ID ?? 0)
      .input("PRICE_TYPE_ID", sql.Int, data.PRICE_TYPE_ID ?? 0)
      .input("PRICE_LIST_ID", sql.Int, data.PRICE_LIST_ID ?? 0)
      .query(`
        SELECT 1 FROM [VMaster].[TBL_PRICE_LIST_MASTER]
        WHERE COMPANY_ID = @COMPANY_ID AND PRICE_TYPE_ID = @PRICE_TYPE_ID
        AND PRICE_LIST_ID <> @PRICE_LIST_ID
      `);

    if (duplicateCheck.recordset.length > 0) {
      throw new Error("Price List Already Exists");
    }

    await pool
      .request()
      .input("PRICE_LIST_ID", sql.Int, data.PRICE_LIST_ID ?? 0)
      .input("PRICE_TYPE_ID", sql.Int, data.PRICE_TYPE_ID ?? null)
      .input("COMPANY_ID", sql.Int, data.COMPANY_ID ?? null)
      .input("PRICE_PACKAGE_ID", sql.Int, data.PRICE_PACKAGE_ID ?? null)
      .input("PER_DAY_OR_TRIP_OR_QTY_PRICE", sql.Decimal(15, 2), data.PER_DAY_OR_TRIP_OR_QTY_PRICE ?? null)
      .input("FOOD_LIMIT_AMOUNT", sql.Decimal(15, 2), data.FOOD_LIMIT_AMOUNT ?? null)
      .input("DRINKS_LIMIT_AMOUNT", sql.Decimal(15, 2), data.DRINKS_LIMIT_AMOUNT ?? null)
      .input("ACCOMDATION_LIMIT_AMOUNT", sql.Decimal(15, 2), data.ACCOMDATION_LIMIT_AMOUNT ?? null)
      .input("CURRENCY_ID", sql.Int, data.CURRENCY_ID ?? null)
      .input("EFFECTIVE_FROM", sql.DateTime, data.EFFECTIVE_FROM || null)
      .input("EFFECTIVE_TO", sql.DateTime, data.EFFECTIVE_TO || null)
      .input("REMARKS", sql.VarChar(1000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .query(`
        UPDATE [VMaster].[TBL_PRICE_LIST_MASTER]
        SET PRICE_TYPE_ID = @PRICE_TYPE_ID,
            COMPANY_ID = @COMPANY_ID,
            PRICE_PACKAGE_ID = @PRICE_PACKAGE_ID,
            PER_DAY_OR_TRIP_OR_QTY_PRICE = @PER_DAY_OR_TRIP_OR_QTY_PRICE,
            FOOD_LIMIT_AMOUNT = @FOOD_LIMIT_AMOUNT,
            DRINKS_LIMIT_AMOUNT = @DRINKS_LIMIT_AMOUNT,
            ACCOMDATION_LIMIT_AMOUNT = @ACCOMDATION_LIMIT_AMOUNT,
            CURRENCY_ID = @CURRENCY_ID,
            EFFECTIVE_FROM = @EFFECTIVE_FROM,
            EFFECTIVE_TO = @EFFECTIVE_TO,
            REMARKS = @REMARKS,
            STATUS_MASTER = @STATUS_MASTER,
            MODIFIED_BY = @USER,
            MODIFIED_DATE = GETDATE(),
            MODIFIED_MAC_ADDRESS = @MAC_ADDRESS
        WHERE PRICE_LIST_ID = @PRICE_LIST_ID
      `);

    return { message: "Record Updated Successfully" };
  } catch (error) {
    console.error("updatePriceListMaster error:", error);
    throw error;
  }
};

export const deletePriceListMasterService = async (
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
      .input("PRICE_LIST_ID", sql.Int, id)
      .query(`
        SELECT 1 FROM [VMaster].[TBL_PRICE_LIST_MASTER]
        WHERE PRICE_LIST_ID = @PRICE_LIST_ID
      `);

    if (existsCheck.recordset.length === 0) {
      throw new Error("Record Not Found");
    }

    await pool
      .request()
      .input("PRICE_LIST_ID", sql.Int, id)
      .query(`
        DELETE FROM [VMaster].[TBL_PRICE_LIST_MASTER]
        WHERE PRICE_LIST_ID = @PRICE_LIST_ID
      `);

    return { message: "Data Deleted Successfully" };
  } catch (error) {
    console.error("deletePriceListMaster error:", error);
    throw error;
  }
};
