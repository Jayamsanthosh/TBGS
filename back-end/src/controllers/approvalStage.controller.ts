import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  getAllApprovalStageHdrService,
  getApprovalStageHdrService,
  getApprovalStageDtlByStageService,
  getApprovalStageDtlService,
  saveApprovalStageHdrCombinedService,
  updateApprovalStageHdrCombinedService,
  saveApprovalStageDtlService,
  updateApprovalStageDtlService,
  deleteApprovalStageDtlService,
  deleteApprovalStageHdrService,
  ApprovalStageHdrData,
  ApprovalStageDtlData,
} from "../services/approvalStage.services";

export const getAllApprovalStageHdr = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = ((req.query.status as string) || "ALL").trim() || "ALL";
    const search = (req.query.search as string) || null;
    const data = await getAllApprovalStageHdrService(status, search);
    res.json({ success: true, count: data.length, data });
  } catch (error: any) {
    console.error("GetAllApprovalStageHdr error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getApprovalStageHdr = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Approval Stage ID is required" });
    return;
  }

  try {
    const data = await getApprovalStageHdrService(parseInt(id as string, 10));
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("GetApprovalStageHdr error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getApprovalStageDtlByStage = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Approval Stage ID is required" });
    return;
  }

  try {
    const status = ((req.query.status as string) || "A").trim() || "A";
    const data = await getApprovalStageDtlByStageService(parseInt(id as string, 10), status);
    res.json({ success: true, count: data.length, data });
  } catch (error: any) {
    console.error("GetApprovalStageDtlByStage error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getApprovalStageDtl = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Approval Stage Detail ID is required" });
    return;
  }

  try {
    const data = await getApprovalStageDtlService(parseInt(id as string, 10));
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("GetApprovalStageDtl error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveApprovalStageHdr = async (req: Request, res: Response): Promise<void> => {
  const data: ApprovalStageHdrData = req.body;

  if (!data.APPROVAL_STAGE_NAME || !String(data.APPROVAL_STAGE_NAME).trim()) {
    res.status(400).json({ success: false, message: "Approval Stage Name is required" });
    return;
  }
  if (data.APPROVAL_STAGE_ORDER === undefined || data.APPROVAL_STAGE_ORDER === null || (data.APPROVAL_STAGE_ORDER as any) === "") {
    res.status(400).json({ success: false, message: "Approval Stage Order is required" });
    return;
  }
  if (!data.NO_OF_APPROVALS_REQUIRED || Number(data.NO_OF_APPROVALS_REQUIRED) <= 0) {
    res.status(400).json({ success: false, message: "Number of Approvals Required must be greater than 0" });
    return;
  }
  if (!data.NO_OF_REJECT_REQUIRED || Number(data.NO_OF_REJECT_REQUIRED) <= 0) {
    res.status(400).json({ success: false, message: "Number of Rejects Required must be greater than 0" });
    return;
  }

  const { USER, MAC_ADDRESS } = identityFrom(req);
  data.USER = data.USER || USER || "Admin";
  data.MAC_ADDRESS = data.MAC_ADDRESS || MAC_ADDRESS || "WEB";

  try {
    const result = await saveApprovalStageHdrCombinedService(data);
    res.json({ success: true, message: result.message, APPROVAL_STAGE_ID: result.APPROVAL_STAGE_ID });
  } catch (error: any) {
    console.error("SaveApprovalStageHdr error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateApprovalStageHdr = async (req: Request, res: Response): Promise<void> => {
  const data: ApprovalStageHdrData = req.body;
  const { id } = req.params;
  const { USER, MAC_ADDRESS } = identityFrom(req);

  if (!data.APPROVAL_STAGE_ID && id) {
    data.APPROVAL_STAGE_ID = parseInt(id as string, 10);
  }
  data.USER = data.USER || USER || "Admin";
  data.MAC_ADDRESS = data.MAC_ADDRESS || MAC_ADDRESS || "WEB";

  if (!data.APPROVAL_STAGE_ID) {
    res.status(400).json({ success: false, message: "Approval Stage ID is required" });
    return;
  }

  try {
    const result = await updateApprovalStageHdrCombinedService(data);
    res.json({ success: true, message: result.message, APPROVAL_STAGE_ID: result.APPROVAL_STAGE_ID });
  } catch (error: any) {
    console.error("UpdateApprovalStageHdr error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveApprovalStageDtl = async (req: Request, res: Response): Promise<void> => {
  const data: ApprovalStageDtlData = req.body;
  const { USER, MAC_ADDRESS } = identityFrom(req);

  if (!data.APPROVAL_STAGE_ID || !data.USER_ID) {
    res.status(400).json({ success: false, message: "Approval Stage and User are required" });
    return;
  }

  try {
    const result = await saveApprovalStageDtlService(data, USER || "Admin", MAC_ADDRESS || "WEB");
    res.json({ success: true, message: result.message, APPROVAL_STAGE_DTL_ID: result.APPROVAL_STAGE_DTL_ID });
  } catch (error: any) {
    console.error("SaveApprovalStageDtl error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateApprovalStageDtl = async (req: Request, res: Response): Promise<void> => {
  const data: ApprovalStageDtlData = req.body;
  const { id } = req.params;
  const { USER, MAC_ADDRESS } = identityFrom(req);

  if (!data.APPROVAL_STAGE_DTL_ID && id) {
    data.APPROVAL_STAGE_DTL_ID = parseInt(id as string, 10);
  }

  try {
    const result = await updateApprovalStageDtlService(data, USER || "Admin", MAC_ADDRESS || "WEB");
    res.json({ success: true, message: result.message });
  } catch (error: any) {
    console.error("UpdateApprovalStageDtl error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteApprovalStageDtl = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Approval Stage Detail ID is required" });
    return;
  }

  try {
    const result = await deleteApprovalStageDtlService(parseInt(id as string, 10), USER || "Admin", MAC_ADDRESS || "WEB");
    res.json({ success: true, message: result.message });
  } catch (error: any) {
    console.error("DeleteApprovalStageDtl error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteApprovalStageHdr = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Approval Stage ID is required" });
    return;
  }

  try {
    const result = await deleteApprovalStageHdrService(parseInt(id as string, 10));
    res.json({ success: true, message: result.message });
  } catch (error: any) {
    console.error("DeleteApprovalStageHdr error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
