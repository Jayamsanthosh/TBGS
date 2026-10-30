import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export const PRODUCT_MASTER_LINK_ID = 110;

export interface ProductMasterData {
  PRODUCT_ID?: number;
  PRODUCT_NAME: string;
  TBS_PRODUCT_NAME?: string;
  MAIN_CATEGORY_ID?: number;
  SUB_CATEGORY_ID?: number;
  UOM_ID?: number;
  NO_OF_PCS_PER_PACKING?: number;
  ALTERNATE_UOM_ID?: number;
  COST_CENTRE_ID?: number;
  COMPANY_ID?: number;
  TRUCK_ID?: number;
  PRODUCTION_COST?: number;
  VAT_PERCENTAGE?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
  LINK_ID?: number | null;
}

const toIntOrNull = (v: any): number | null =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);

const toLinkId = (v: any): number => {
  const n = toIntOrNull(v);
  return n && n > 0 ? n : PRODUCT_MASTER_LINK_ID;
};

const stampLinkId = async (productId: number, linkId: number): Promise<number> => {
  const pool = getPool();
  const result = await pool
    .request()
    .input("PRODUCT_ID", sql.Int, productId)
    .input("LINK_ID", sql.Int, linkId)
    .query("UPDATE [VMaster].[TBL_PRODUCT_MASTER] SET LINK_ID = @LINK_ID WHERE PRODUCT_ID = @PRODUCT_ID");
  return result.rowsAffected?.[0] ?? 0;
};

const notFound = (): Error & { httpStatus?: number } => {
  const error = new Error("Product not found. It may have already been deleted.") as Error & { httpStatus?: number };
  error.httpStatus = 404;
  return error;
};

export const getAllProductMasterService = async (status = "ALL") => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("STATUS", sql.VarChar(50), status || "ALL")
      .execute("VMaster.SHOW_PRODUCT_MASTER");

    const rows = result.recordset || [];
    if (!rows.length) return rows;

    /* SHOW_PRODUCT_MASTER does not project TRUCK_ID, but the purchase screens
       auto-fill Truck from it, so merge the column back in. */
    const trucks = await pool
      .request()
      .query("SELECT PRODUCT_ID, TRUCK_ID FROM [VMaster].[TBL_PRODUCT_MASTER]");
    const truckById = new Map<number, number | null>(
      (trucks.recordset || []).map((r: any) => [r.PRODUCT_ID, r.TRUCK_ID ?? null])
    );

    return rows.map((row: any) => ({ ...row, TRUCK_ID: truckById.get(row.PRODUCT_ID) ?? null }));
  } catch (error) {
    console.error("SHOW_PRODUCT_MASTER SP error:", error);
    throw error;
  }
};

export const getProductMasterByIdService = async (id: number, linkId: number = PRODUCT_MASTER_LINK_ID) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("PRODUCT_ID", sql.Int, id)
      .input("LINK_ID", sql.Int, toLinkId(linkId))
      .execute("VMaster.GET_PRODUCT_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_PRODUCT_MASTER SP error:", error);
    throw error;
  }
};

export const saveProductMasterService = async (data: ProductMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const linkId = toLinkId(data.LINK_ID);

  try {
    const result = await pool
      .request()
      .input("PRODUCT_ID", sql.Int, data.PRODUCT_ID ?? 0)
      .input("PRODUCT_NAME", sql.VarChar(1500), data.PRODUCT_NAME || null)
      .input("TBS_PRODUCT_NAME", sql.VarChar(sql.MAX), data.TBS_PRODUCT_NAME || null)
      .input("MAIN_CATEGORY_ID", sql.Int, data.MAIN_CATEGORY_ID ?? null)
      .input("SUB_CATEGORY_ID", sql.Int, data.SUB_CATEGORY_ID ?? null)
      .input("UOM_ID", sql.Int, data.UOM_ID ?? null)
      .input("NO_OF_PCS_PER_PACKING", sql.Decimal(15, 2), data.NO_OF_PCS_PER_PACKING ?? null)
      .input("ALTERNATE_UOM_ID", sql.Int, data.ALTERNATE_UOM_ID ?? null)
      .input("COST_CENTRE_ID", sql.Int, data.COST_CENTRE_ID ?? null)
      .input("COMPANY_ID", sql.Int, data.COMPANY_ID ?? null)
      .input("TRUCK_ID", sql.Int, toIntOrNull(data.TRUCK_ID))
      .input("PRODUCTION_COST", sql.Decimal(15, 2), data.PRODUCTION_COST ?? null)
      .input("VAT_PERCENTAGE", sql.Decimal(15, 2), data.VAT_PERCENTAGE ?? null)
      .input("REMARKS", sql.VarChar(2000), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_PRODUCT_MASTER");

    const { message, data: savedId } = parseSprocResult(result.recordset?.[0], "Failed to save product");

    const productId = savedId === undefined || savedId === null || savedId === "" ? null : Number(savedId);
    if (productId && (await stampLinkId(productId, linkId)) === 0) throw notFound();

    return {
      message: message || "Product saved successfully",
      PRODUCT_ID: productId ?? undefined,
      LINK_ID: linkId,
    };
  } catch (error) {
    console.error("SAVE_PRODUCT_MASTER SP error:", error);
    throw error;
  }
};

export const updateProductMasterService = async (data: ProductMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const linkId = toLinkId(data.LINK_ID);
  const productId = data.PRODUCT_ID ?? 0;

  try {
    const result = await pool
      .request()
      .input("PRODUCT_ID", sql.Int, productId)
      .input("PRODUCT_NAME", sql.VarChar(1500), data.PRODUCT_NAME ?? null)
      .input("TBS_PRODUCT_NAME", sql.VarChar(sql.MAX), data.TBS_PRODUCT_NAME ?? null)
      .input("MAIN_CATEGORY_ID", sql.Int, data.MAIN_CATEGORY_ID ?? null)
      .input("SUB_CATEGORY_ID", sql.Int, data.SUB_CATEGORY_ID ?? null)
      .input("UOM_ID", sql.Int, data.UOM_ID ?? null)
      .input("NO_OF_PCS_PER_PACKING", sql.Decimal(15, 2), data.NO_OF_PCS_PER_PACKING ?? null)
      .input("ALTERNATE_UOM_ID", sql.Int, data.ALTERNATE_UOM_ID ?? null)
      .input("COST_CENTRE_ID", sql.Int, data.COST_CENTRE_ID ?? null)
      .input("COMPANY_ID", sql.Int, data.COMPANY_ID ?? null)
      .input("TRUCK_ID", sql.Int, toIntOrNull(data.TRUCK_ID))
      .input("PRODUCTION_COST", sql.Decimal(15, 2), data.PRODUCTION_COST ?? null)
      .input("VAT_PERCENTAGE", sql.Decimal(15, 2), data.VAT_PERCENTAGE ?? null)
      .input("REMARKS", sql.VarChar(2000), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_PRODUCT_MASTER");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to update product");

    /* UPDATE_PRODUCT_MASTER has no existence check and never writes LINK_ID, so
       this also verifies the row and keeps it visible to GET_PRODUCT_MASTER. */
    if ((await stampLinkId(productId, linkId)) === 0) throw notFound();

    return { message: message || "Product updated successfully", PRODUCT_ID: productId };
  } catch (error) {
    console.error("UPDATE_PRODUCT_MASTER SP error:", error);
    throw error;
  }
};

export const deleteProductMasterService = async (
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
      .input("PRODUCT_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_PRODUCT_MASTER");

    const { message } = parseSprocResult(result.recordset?.[0], "Failed to delete product");

    return { message: message || "Product deleted successfully" };
  } catch (error) {
    console.error("DELETE_PRODUCT_MASTER SP error:", error);
    const msg = ((error as any)?.message as string) || "";
    if (msg.includes("REFERENCE constraint") || msg.includes("FK_")) {
      const conflict = new Error("Cannot delete: This product is used by other records.") as Error & { httpStatus?: number };
      conflict.httpStatus = 409;
      throw conflict;
    }
    throw error;
  }
};
