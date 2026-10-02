import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  getAllMappingService,
  getMappingByIdService,
  loadMappingService,
  saveMappingService,
  updateMappingService,
  deleteMappingService,
  MAPPING_STATUSES,
  type CompanyBranchMappingData,
} from "../services/companyBranchMapping.services";

const fail = (res: Response, error: any) => {
  /* parseSprocResult marks procedure level validation failures as 400; anything
     else is a genuine server fault. */
  const status = (error as any)?.httpStatus ?? 500;
  console.error("CompanyBranchMapping error:", error);
  res.status(status).json({ success: false, message: error?.message || "Internal server error" });
};

const toInt = (v: any): number | undefined => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

export const getAllMapping = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const items = await getAllMappingService(status || undefined);
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    fail(res, error);
  }
};

export const loadMapping = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = toInt(req.query.companyId);
    const branchId = toInt(req.query.branchId);
    const status = (req.query.status as string | undefined) || "ALL";
    const items = await loadMappingService(companyId, branchId, status);
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    fail(res, error);
  }
};

export const getMappingById = async (req: Request, res: Response): Promise<void> => {
  const id = toInt(req.params.id);

  if (id === undefined) {
    res.status(400).json({ success: false, message: "MAPPING_ID is required" });
    return;
  }

  try {
    const item = await getMappingByIdService(id);

    if (!item) {
      res.status(404).json({ success: false, message: "Mapping not found" });
      return;
    }

    res.json({ success: true, data: { ...item, id: item.MAPPING_ID } });
  } catch (error: any) {
    fail(res, error);
  }
};

export const saveMapping = async (req: Request, res: Response): Promise<void> => {
  const data: CompanyBranchMappingData = req.body;

  if (!data.COMPANY_ID) {
    res.status(400).json({ success: false, message: "Company is required" });
    return;
  }

  if (!data.BRANCH_ID) {
    res.status(400).json({ success: false, message: "Branch is required" });
    return;
  }

  if (data.STATUS_MASTER && !MAPPING_STATUSES.includes(String(data.STATUS_MASTER).toUpperCase())) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    const result = await saveMappingService(data);
    res.status(201).json({
      success: true,
      message: result.message || "Data saved successfully",
      MAPPING_ID: result.MAPPING_ID,
      id: result.MAPPING_ID,
    });
  } catch (error: any) {
    fail(res, error);
  }
};

export const updateMapping = async (req: Request, res: Response): Promise<void> => {
  const data: CompanyBranchMappingData = req.body;
  const id = toInt(req.params.id) ?? toInt(data.MAPPING_ID);

  if (id === undefined) {
    res.status(400).json({ success: false, message: "MAPPING_ID is required" });
    return;
  }

  if (!data.COMPANY_ID) {
    res.status(400).json({ success: false, message: "Company is required" });
    return;
  }

  if (!data.BRANCH_ID) {
    res.status(400).json({ success: false, message: "Branch is required" });
    return;
  }

  if (data.STATUS_MASTER && !MAPPING_STATUSES.includes(String(data.STATUS_MASTER).toUpperCase())) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  data.MAPPING_ID = id;

  try {
    const result = await updateMappingService(data);
    res.json({
      success: true,
      message: result.message || "Record updated successfully",
      MAPPING_ID: result.MAPPING_ID,
    });
  } catch (error: any) {
    fail(res, error);
  }
};

export const deleteMapping = async (req: Request, res: Response): Promise<void> => {
  const id = toInt(req.params.id);
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (id === undefined) {
    res.status(400).json({ success: false, message: "MAPPING_ID is required" });
    return;
  }

  try {
    const result = await deleteMappingService(id, USER, ROLE, MAC_ADDRESS);
    res.json({
      success: true,
      message: result.message || "Record deleted successfully",
      MAPPING_ID: result.MAPPING_ID,
    });
  } catch (error: any) {
    fail(res, error);
  }
};
