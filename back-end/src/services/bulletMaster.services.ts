import sql from "mssql";
import { getPool } from "../config/db";
import { parseSprocResult } from "../utils/sprocResult";

export interface BulletMasterData {
  BULLET_ID?: number;
  BULLET_CODE?: string;
  BULLET_NAME?: string;
  BULLET_TYPE_ID?: number;
  AMMUNITION_BRAND_ID?: number;
  CALIBER_ID?: number;
  GRAIN_WEIGHT?: number;
  PACK_SIZE?: number;
  ROUNDS_PER_BOX?: number;
  REORDER_LEVEL?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

export interface BulletMasterFilter {
  ammunitionBrandId?: string;
  caliberId?: string;
  status?: string;
}

const serializeRecordset = (rows: any[]) =>
  (rows || []).map((r: any) => ({ ...r, id: r.BULLET_ID }));

const addFilterParam = (req: any, name: string, value: string | undefined) => {
  req.input(name, sql.VarChar(50), value || "0");
};

export const getAllBulletMasterService = async (filters: BulletMasterFilter) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  const status = filters.status || "ALL";

  try {
    if (status === "ALL") {
      const statuses = ["AC", "IA"];
      let allRows: any[] = [];
      for (const s of statuses) {
        const req = pool.request();
        addFilterParam(req, "AMMUNITION_BRAND_ID", filters.ammunitionBrandId);
        addFilterParam(req, "CALIBER_ID", filters.caliberId);
        addFilterParam(req, "STATUS", s);
        const result = await req.execute("VMaster.SHOW_BULLET_MASTER");
        allRows = allRows.concat(result.recordset || []);
      }
      return serializeRecordset(allRows);
    }

    const req = pool.request();
    addFilterParam(req, "AMMUNITION_BRAND_ID", filters.ammunitionBrandId);
    addFilterParam(req, "CALIBER_ID", filters.caliberId);
    addFilterParam(req, "STATUS", status);
    const result = await req.execute("VMaster.SHOW_BULLET_MASTER");
    return serializeRecordset(result.recordset || []);
  } catch (error) {
    console.error("SHOW_BULLET_MASTER SP error:", error);
    throw error;
  }
};

export const getBulletMasterByIdService = async (id: number) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("BULLET_ID", sql.Int, id)
      .execute("VMaster.GET_BULLET_MASTER");

    return result.recordset[0] || null;
  } catch (error) {
    console.error("GET_BULLET_MASTER SP error:", error);
    throw error;
  }
};

export const saveBulletMasterService = async (data: BulletMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("BULLET_ID", sql.Int, 0)
      .input("BULLET_CODE", sql.VarChar(20), data.BULLET_CODE || null)
      .input("BULLET_NAME", sql.VarChar(100), data.BULLET_NAME || null)
      .input("BULLET_TYPE_ID", sql.Int, data.BULLET_TYPE_ID ?? null)
      .input("AMMUNITION_BRAND_ID", sql.Int, data.AMMUNITION_BRAND_ID ?? null)
      .input("CALIBER_ID", sql.Int, data.CALIBER_ID ?? null)
      .input("GRAIN_WEIGHT", sql.Decimal(10, 2), data.GRAIN_WEIGHT ?? null)
      .input("PACK_SIZE", sql.Int, data.PACK_SIZE ?? null)
      .input("ROUNDS_PER_BOX", sql.Int, data.ROUNDS_PER_BOX ?? null)
      .input("REORDER_LEVEL", sql.Int, data.REORDER_LEVEL ?? null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS || null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER || null)
      .input("USER", sql.VarChar(50), data.USER || "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS || "WEB")
      .execute("VMaster.SAVE_BULLET_MASTER");

    const { status, message, data: savedData } = parseSprocResult(result.recordset?.[0], "Failed to save bullet master");

    return { message: message || "Data saved successfully", BULLET_ID: savedData };
  } catch (error) {
    console.error("SAVE_BULLET_MASTER SP error:", error);
    throw error;
  }
};

export const updateBulletMasterService = async (data: BulletMasterData) => {
  const pool = getPool();
  if (!pool) throw new Error("Database not connected");

  try {
    const result = await pool
      .request()
      .input("BULLET_ID", sql.Int, data.BULLET_ID ?? 0)
      .input("BULLET_CODE", sql.VarChar(20), data.BULLET_CODE ?? null)
      .input("BULLET_NAME", sql.VarChar(100), data.BULLET_NAME ?? null)
      .input("BULLET_TYPE_ID", sql.Int, data.BULLET_TYPE_ID ?? null)
      .input("AMMUNITION_BRAND_ID", sql.Int, data.AMMUNITION_BRAND_ID ?? null)
      .input("CALIBER_ID", sql.Int, data.CALIBER_ID ?? null)
      .input("GRAIN_WEIGHT", sql.Decimal(10, 2), data.GRAIN_WEIGHT ?? null)
      .input("PACK_SIZE", sql.Int, data.PACK_SIZE ?? null)
      .input("ROUNDS_PER_BOX", sql.Int, data.ROUNDS_PER_BOX ?? null)
      .input("REORDER_LEVEL", sql.Int, data.REORDER_LEVEL ?? null)
      .input("REMARKS", sql.VarChar(100), data.REMARKS ?? null)
      .input("STATUS_MASTER", sql.VarChar(20), data.STATUS_MASTER ?? null)
      .input("USER", sql.VarChar(50), data.USER ?? "Admin")
      .input("MAC_ADDRESS", sql.VarChar(50), data.MAC_ADDRESS ?? "WEB")
      .execute("VMaster.UPDATE_BULLET_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to update bullet master");

    return { message: message || "Record updated successfully" };
  } catch (error) {
    console.error("UPDATE_BULLET_MASTER SP error:", error);
    throw error;
  }
};

export const deleteBulletMasterService = async (
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
      .input("BULLET_ID", sql.Int, id)
      .input("USER", sql.VarChar(50), user || "Admin")
      .input("ROLE", sql.VarChar(50), role || "Manager")
      .input("MAC_ADDRESS", sql.VarChar(50), macAddress || "WEB")
      .execute("VMaster.DELETE_BULLET_MASTER");

    const { status, message } = parseSprocResult(result.recordset?.[0], "Failed to delete bullet master");

    return { message: message || "Data deleted successfully" };
  } catch (error) {
    const msg = (error as any)?.message || "";
    if (msg.includes("REFERENCE constraint") || msg.includes("FK_")) {
      throw new Error("Cannot delete: This bullet has associated records. Remove or reassign them first.");
    }
    throw error;
  }
};