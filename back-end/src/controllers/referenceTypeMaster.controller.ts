import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  saveReferenceTypeMasterService,
  updateReferenceTypeMasterService,
  deleteReferenceTypeMasterService,
  getReferenceTypeMasterListService,
  getReferenceTypeMasterByIdService,
  loadReferenceTypeMasterOptionsService,
  ReferenceTypeMasterData
} from "../services/referenceTypeMaster.services";

export const getAllReferenceTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const status = (req.query.status as string) || "ALL";
  const search = (req.query.search as string) || "";
  const page = req.query.page != null && req.query.page !== "" ? Number(req.query.page) : null;
  const pageSize =
    req.query.pageSize != null && req.query.pageSize !== "" ? Number(req.query.pageSize) : null;

  try {
    const result = await getReferenceTypeMasterListService({ status, search, page, pageSize });
    res.json({ success: true, total: result.total, count: result.rows.length, data: result.rows });
  } catch (error: any) {
    console.error("GetAllReferenceTypeMaster error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getReferenceTypeMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const idNumber = parseInt(id as string, 10);
  if (!id || Number.isNaN(idNumber) || idNumber <= 0) {
    res.status(400).json({ success: false, message: "Reference Type ID must be a valid positive integer" });
    return;
  }

  try {
    const referenceTypeRow = await getReferenceTypeMasterByIdService(idNumber);

    if (!referenceTypeRow) {
      res.status(404).json({ success: false, message: "Reference Type not found" });
      return;
    }

    res.json({ success: true, data: referenceTypeRow });
  } catch (error: any) {
    console.error("GetReferenceTypeMasterById error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getReferenceTypeMasterLoad = async (req: Request, res: Response): Promise<void> => {
  const includeInactive = req.query.includeInactive === "true" || req.query.includeInactive === "1";

  try {
    const options = await loadReferenceTypeMasterOptionsService(includeInactive);
    res.json({ success: true, count: options.length, data: options });
  } catch (error: any) {
    console.error("GetReferenceTypeMasterLoad error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveReferenceTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const referenceTypeData: ReferenceTypeMasterData = req.body;

  if (!referenceTypeData.REFERENCE_TYPE_CODE) {
    res.status(400).json({ success: false, message: "Reference Type Code is required" });
    return;
  }

  if (!referenceTypeData.REFERENCE_TYPE_NAME) {
    res.status(400).json({ success: false, message: "Reference Type Name is required" });
    return;
  }

  try {
    const result = await saveReferenceTypeMasterService(referenceTypeData);
    res.json({
      success: true,
      message: result.message || "Reference Type saved successfully",
      REFERENCE_TYPE_ID: result.id
    });
  } catch (error: any) {
    console.error("SaveReferenceTypeMaster error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateReferenceTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const referenceTypeData: ReferenceTypeMasterData = req.body;
  const { id } = req.params;

  if (!referenceTypeData.REFERENCE_TYPE_ID && id) {
    const idNumber = parseInt(id as string, 10);
    if (!Number.isNaN(idNumber) && idNumber > 0) referenceTypeData.REFERENCE_TYPE_ID = idNumber;
  }

  if (!referenceTypeData.REFERENCE_TYPE_ID) {
    res.status(400).json({ success: false, message: "Reference Type ID is required" });
    return;
  }

  if (!referenceTypeData.REFERENCE_TYPE_CODE) {
    res.status(400).json({ success: false, message: "Reference Type Code is required" });
    return;
  }

  if (!referenceTypeData.REFERENCE_TYPE_NAME) {
    res.status(400).json({ success: false, message: "Reference Type Name is required" });
    return;
  }

  try {
    const result = await updateReferenceTypeMasterService(referenceTypeData);
    res.json({ success: true, message: result.message || "Reference Type updated successfully" });
  } catch (error: any) {
    console.error("UpdateReferenceTypeMaster error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteReferenceTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  const idNumber = parseInt(id as string, 10);
  if (!id || Number.isNaN(idNumber) || idNumber <= 0) {
    res.status(400).json({ success: false, message: "Reference Type ID must be a valid positive integer" });
    return;
  }

  try {
    const result = await deleteReferenceTypeMasterService(
      idNumber,
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({
      success: true,
      message: result.message || "Reference Type deleted successfully",
      REFERENCE_TYPE_ID: idNumber
    });
  } catch (error: any) {
    console.error("DeleteReferenceTypeMaster error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};