import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  listBatchesBySourceService,
  getBatchService,
  saveBatchService,
  updateBatchService,
  deleteBatchService,
  BatchMasterData,
} from "../services/batchMaster.services";

const toPositiveInt = (v: any): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
};

const toNum = (v: any): number => {
  if (v === "" || v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
};

const validateBatch = (data: BatchMasterData, res: Response): boolean => {
  const bad = (message: string) => {
    res.status(400).json({ success: false, message });
    return false;
  };

  if (!data.BATCH_SOURCE_REF_NO) return bad("Source document reference no is required");
  if (!data.BATCH_NO || !String(data.BATCH_NO).trim()) return bad("Batch No is required");
  if (!data.PRODUCT_ID) return bad("Product is required");
  if (!data.UOM_ID) return bad("UOM is required");
  if (toNum(data.BATCH_QTY) <= 0) return bad("Batch Quantity must be greater than 0");
  if (data.MANUFACTURE_DATE && data.EXPIRY_DATE && new Date(data.EXPIRY_DATE) < new Date(data.MANUFACTURE_DATE)) {
    return bad("Expiry Date cannot be before Manufacture Date");
  }

  return true;
};

export const getBatchesBySource = async (req: Request, res: Response): Promise<void> => {
  const refNo = String(req.query.refNo ?? "").trim();

  if (!refNo) {
    res.status(400).json({ success: false, message: "Source document reference no is required" });
    return;
  }

  try {
    const data = await listBatchesBySourceService(refNo);
    res.json({ success: true, count: data.length, data });
  } catch (error: any) {
    console.error("GetBatchesBySource error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getBatch = async (req: Request, res: Response): Promise<void> => {
  const id = toPositiveInt(req.params.id);

  if (!id) {
    res.status(400).json({ success: false, message: "Valid batch id is required" });
    return;
  }

  try {
    const data = await getBatchService(id);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("GetBatch error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveBatch = async (req: Request, res: Response): Promise<void> => {
  const { USER, MAC_ADDRESS } = identityFrom(req);
  const data: BatchMasterData = { ...req.body, USER: USER || "Admin", MAC_ADDRESS: MAC_ADDRESS || "WEB" };

  if (!validateBatch(data, res)) return;

  try {
    const result = await saveBatchService(data);
    res.json({ success: true, message: result.message || "Batch saved successfully", BATCH_ID: result.BATCH_ID });
  } catch (error: any) {
    console.error("SaveBatch error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateBatch = async (req: Request, res: Response): Promise<void> => {
  const { USER, MAC_ADDRESS } = identityFrom(req);
  const id = toPositiveInt(req.params.id);

  if (!id) {
    res.status(400).json({ success: false, message: "Valid batch id is required" });
    return;
  }

  const data: BatchMasterData = {
    ...req.body,
    BATCH_ID: id,
    USER: USER || "Admin",
    MAC_ADDRESS: MAC_ADDRESS || "WEB",
  };

  if (!validateBatch(data, res)) return;

  try {
    const result = await updateBatchService(data);
    res.json({ success: true, message: result.message || "Batch updated successfully" });
  } catch (error: any) {
    console.error("UpdateBatch error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteBatch = async (req: Request, res: Response): Promise<void> => {
  const id = toPositiveInt(req.params.id);
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Valid batch id is required" });
    return;
  }

  try {
    const result = await deleteBatchService(
      id,
      USER || "Admin",
      ROLE || "Admin",
      MAC_ADDRESS || "WEB"
    );
    res.json({ success: true, message: result.message || "Batch deleted successfully" });
  } catch (error: any) {
    console.error("DeleteBatch error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
