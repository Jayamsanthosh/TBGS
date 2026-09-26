import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  saveStatusMasterService,
  updateStatusMasterService,
  deleteStatusMasterService,
  getStatusMasterListService,
  getStatusMasterByIdService,
  loadStatusMasterOptionsService,
  StatusMasterData
} from "../services/statusMaster.services";

export const getAllStatusMaster = async (req: Request, res: Response): Promise<void> => {
  const status = (req.query.status as string) || "ALL";
  const category = (req.query.category as string) || "";
  const search = (req.query.search as string) || "";
  const page = req.query.page != null && req.query.page !== "" ? Number(req.query.page) : null;
  const pageSize =
    req.query.pageSize != null && req.query.pageSize !== "" ? Number(req.query.pageSize) : null;

  try {
    const result = await getStatusMasterListService({ status, category, search, page, pageSize });
    res.json({ success: true, total: result.total, count: result.rows.length, data: result.rows });
  } catch (error: any) {
    console.error("GetAllStatusMaster error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getStatusMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const idNumber = parseInt(id as string, 10);
  if (!id || Number.isNaN(idNumber) || idNumber <= 0) {
    res.status(400).json({ success: false, message: "Status ID must be a valid positive integer" });
    return;
  }

  try {
    const statusRow = await getStatusMasterByIdService(idNumber);

    if (!statusRow) {
      res.status(404).json({ success: false, message: "Status not found" });
      return;
    }

    res.json({ success: true, data: statusRow });
  } catch (error: any) {
    console.error("GetStatusMasterById error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getStatusMasterLoad = async (req: Request, res: Response): Promise<void> => {
  const category = (req.query.category as string) || "";
  const includeInactive = req.query.includeInactive === "true" || req.query.includeInactive === "1";

  try {
    const options = await loadStatusMasterOptionsService(category, includeInactive);
    res.json({ success: true, count: options.length, data: options });
  } catch (error: any) {
    console.error("GetStatusMasterLoad error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveStatusMaster = async (req: Request, res: Response): Promise<void> => {
  const statusData: StatusMasterData = req.body;

  if (!statusData.STATUS_CODE) {
    res.status(400).json({ success: false, message: "Status Code is required" });
    return;
  }

  if (!statusData.STATUS_NAME) {
    res.status(400).json({ success: false, message: "Status Name is required" });
    return;
  }

  try {
    const result = await saveStatusMasterService(statusData);
    res.json({
      success: true,
      message: result.message || "Status saved successfully",
      STATUS_ID: result.id
    });
  } catch (error: any) {
    console.error("SaveStatusMaster error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateStatusMaster = async (req: Request, res: Response): Promise<void> => {
  const statusData: StatusMasterData = req.body;
  const { id } = req.params;

  if (!statusData.STATUS_ID && id) {
    const idNumber = parseInt(id as string, 10);
    if (!Number.isNaN(idNumber) && idNumber > 0) statusData.STATUS_ID = idNumber;
  }

  if (!statusData.STATUS_ID) {
    res.status(400).json({ success: false, message: "Status ID is required" });
    return;
  }

  if (!statusData.STATUS_CODE) {
    res.status(400).json({ success: false, message: "Status Code is required" });
    return;
  }

  if (!statusData.STATUS_NAME) {
    res.status(400).json({ success: false, message: "Status Name is required" });
    return;
  }

  try {
    const result = await updateStatusMasterService(statusData);
    res.json({ success: true, message: result.message || "Status updated successfully" });
  } catch (error: any) {
    console.error("UpdateStatusMaster error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteStatusMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  const idNumber = parseInt(id as string, 10);
  if (!id || Number.isNaN(idNumber) || idNumber <= 0) {
    res.status(400).json({ success: false, message: "Status ID must be a valid positive integer" });
    return;
  }

  try {
    const result = await deleteStatusMasterService(
      idNumber,
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({
      success: true,
      message: result.message || "Status deleted successfully",
      STATUS_ID: idNumber
    });
  } catch (error: any) {
    console.error("DeleteStatusMaster error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};