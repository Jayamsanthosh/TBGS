import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  getAllApprovalTemplateHdrService,
  getApprovalTemplateHdrService,
  getRequesterDtlsByTemplateService,
  getStageDtlsByTemplateService,
  saveApprovalTemplateHdrCombinedService,
  updateApprovalTemplateHdrCombinedService,
  saveApprovalTemplateRequesterDtlService,
  updateApprovalTemplateRequesterDtlService,
  deleteApprovalTemplateRequesterDtlService,
  saveApprovalTemplateStageDtlService,
  updateApprovalTemplateStageDtlService,
  deleteApprovalTemplateStageDtlService,
  deleteApprovalTemplateHdrService,
  ApprovalTemplateHdrData,
  ApprovalTemplateRequesterDtlData,
  ApprovalTemplateStageDtlData,
} from "../services/approvalTemplate.services";

const queryNum = (v: unknown): number | null => {
  if (v === undefined || v === null || String(v).trim() === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

export const getAllApprovalTemplateHdr = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = ((req.query.status as string) || "ALL").trim() || "ALL";
    const search = (req.query.search as string) || null;
    const pageLinkId = queryNum(req.query.pageLinkId);
    const companyId = queryNum(req.query.companyId);
    const campId = queryNum(req.query.campId);
    const storeId = queryNum(req.query.storeId);

    const data = await getAllApprovalTemplateHdrService(status, search, pageLinkId, companyId, campId, storeId);
    res.json({ success: true, count: data.length, data });
  } catch (error: any) {
    console.error("GetAllApprovalTemplateHdr error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getApprovalTemplateHdr = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Approval Template ID is required" });
    return;
  }

  try {
    const data = await getApprovalTemplateHdrService(parseInt(id as string, 10));
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("GetApprovalTemplateHdr error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getRequesterDtlsByTemplate = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Approval Template ID is required" });
    return;
  }

  try {
    const status = ((req.query.status as string) || "ALL").trim() || "ALL";
    const data = await getRequesterDtlsByTemplateService(parseInt(id as string, 10), status);
    res.json({ success: true, count: data.length, data });
  } catch (error: any) {
    console.error("GetRequesterDtlsByTemplate error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getStageDtlsByTemplate = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Approval Template ID is required" });
    return;
  }

  try {
    const status = ((req.query.status as string) || "ALL").trim() || "ALL";
    const approvalStageId = queryNum(req.query.approvalStageId);
    const data = await getStageDtlsByTemplateService(parseInt(id as string, 10), status, approvalStageId);
    res.json({ success: true, count: data.length, data });
  } catch (error: any) {
    console.error("GetStageDtlsByTemplate error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveApprovalTemplateHdr = async (req: Request, res: Response): Promise<void> => {
  const data: ApprovalTemplateHdrData = req.body;

  if (!data.APPROVAL_TEMPLATE_NAME || !String(data.APPROVAL_TEMPLATE_NAME).trim()) {
    res.status(400).json({ success: false, message: "Approval Template Name is required" });
    return;
  }
  if (data.PAGE_LINK_ID === undefined || data.PAGE_LINK_ID === null || (data.PAGE_LINK_ID as any) === "") {
    res.status(400).json({ success: false, message: "Link Page is required" });
    return;
  }
  if (String(data.AMOUNT_VALIDATION_STATUS || "").toUpperCase() === "YES") {
    if (data.MIN_AMOUNT === undefined || data.MIN_AMOUNT === null || (data.MIN_AMOUNT as any) === "") {
      res.status(400).json({ success: false, message: "Min Amount is required when amount validation is YES" });
      return;
    }
  }

  const { USER, MAC_ADDRESS } = identityFrom(req);
  data.USER = data.USER || USER || "Admin";
  data.MAC_ADDRESS = data.MAC_ADDRESS || MAC_ADDRESS || "WEB";

  try {
    const result = await saveApprovalTemplateHdrCombinedService(data);
    res.json({ success: true, message: result.message, APPROVAL_TEMPLATE_ID: result.APPROVAL_TEMPLATE_ID });
  } catch (error: any) {
    console.error("SaveApprovalTemplateHdr error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateApprovalTemplateHdr = async (req: Request, res: Response): Promise<void> => {
  const data: ApprovalTemplateHdrData = req.body;
  const { id } = req.params;
  const { USER, MAC_ADDRESS } = identityFrom(req);

  if (!data.APPROVAL_TEMPLATE_ID && id) {
    data.APPROVAL_TEMPLATE_ID = parseInt(id as string, 10);
  }
  data.USER = data.USER || USER || "Admin";
  data.MAC_ADDRESS = data.MAC_ADDRESS || MAC_ADDRESS || "WEB";

  if (!data.APPROVAL_TEMPLATE_ID) {
    res.status(400).json({ success: false, message: "Approval Template ID is required" });
    return;
  }

  try {
    const result = await updateApprovalTemplateHdrCombinedService(data);
    res.json({ success: true, message: result.message, APPROVAL_TEMPLATE_ID: result.APPROVAL_TEMPLATE_ID });
  } catch (error: any) {
    console.error("UpdateApprovalTemplateHdr error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveApprovalTemplateRequesterDtl = async (req: Request, res: Response): Promise<void> => {
  const data: ApprovalTemplateRequesterDtlData = req.body;
  const { USER, MAC_ADDRESS } = identityFrom(req);

  if (!data.APPROVAL_TEMPLATE_ID || !data.USER_ID) {
    res.status(400).json({ success: false, message: "Approval Template and User are required" });
    return;
  }

  try {
    const result = await saveApprovalTemplateRequesterDtlService(data, USER || "Admin", MAC_ADDRESS || "WEB");
    res.json({ success: true, message: result.message, APPROVAL_TEMPLATE_REQ_DTL_ID: result.APPROVAL_TEMPLATE_REQ_DTL_ID });
  } catch (error: any) {
    console.error("SaveApprovalTemplateRequesterDtl error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateApprovalTemplateRequesterDtl = async (req: Request, res: Response): Promise<void> => {
  const data: ApprovalTemplateRequesterDtlData = req.body;
  const { id } = req.params;
  const { USER, MAC_ADDRESS } = identityFrom(req);

  if (!data.APPROVAL_TEMPLATE_REQ_DTL_ID && id) {
    data.APPROVAL_TEMPLATE_REQ_DTL_ID = parseInt(id as string, 10);
  }

  try {
    const result = await updateApprovalTemplateRequesterDtlService(data, USER || "Admin", MAC_ADDRESS || "WEB");
    res.json({ success: true, message: result.message });
  } catch (error: any) {
    console.error("UpdateApprovalTemplateRequesterDtl error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteApprovalTemplateRequesterDtl = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Approval Template Requester Detail ID is required" });
    return;
  }

  try {
    const result = await deleteApprovalTemplateRequesterDtlService(parseInt(id as string, 10), USER || "Admin", MAC_ADDRESS || "WEB");
    res.json({ success: true, message: result.message });
  } catch (error: any) {
    console.error("DeleteApprovalTemplateRequesterDtl error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveApprovalTemplateStageDtl = async (req: Request, res: Response): Promise<void> => {
  const data: ApprovalTemplateStageDtlData = req.body;
  const { USER, MAC_ADDRESS } = identityFrom(req);

  if (!data.APPROVAL_TEMPLATE_ID || !data.APPROVAL_STAGE_ID) {
    res.status(400).json({ success: false, message: "Approval Template and Approval Stage are required" });
    return;
  }
  if (data.STAGE_ORDER === undefined || data.STAGE_ORDER === null || (data.STAGE_ORDER as any) === "") {
    res.status(400).json({ success: false, message: "Stage Order is required" });
    return;
  }

  try {
    const result = await saveApprovalTemplateStageDtlService(data, USER || "Admin", MAC_ADDRESS || "WEB");
    res.json({ success: true, message: result.message, APPROVAL_TEMPLATE_STAGE_DTL_ID: result.APPROVAL_TEMPLATE_STAGE_DTL_ID });
  } catch (error: any) {
    console.error("SaveApprovalTemplateStageDtl error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateApprovalTemplateStageDtl = async (req: Request, res: Response): Promise<void> => {
  const data: ApprovalTemplateStageDtlData = req.body;
  const { id } = req.params;
  const { USER, MAC_ADDRESS } = identityFrom(req);

  if (!data.APPROVAL_TEMPLATE_STAGE_DTL_ID && id) {
    data.APPROVAL_TEMPLATE_STAGE_DTL_ID = parseInt(id as string, 10);
  }

  try {
    const result = await updateApprovalTemplateStageDtlService(data, USER || "Admin", MAC_ADDRESS || "WEB");
    res.json({ success: true, message: result.message });
  } catch (error: any) {
    console.error("UpdateApprovalTemplateStageDtl error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteApprovalTemplateStageDtl = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Approval Template Stage Detail ID is required" });
    return;
  }

  try {
    const result = await deleteApprovalTemplateStageDtlService(parseInt(id as string, 10), USER || "Admin", MAC_ADDRESS || "WEB");
    res.json({ success: true, message: result.message });
  } catch (error: any) {
    console.error("DeleteApprovalTemplateStageDtl error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteApprovalTemplateHdr = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Approval Template ID is required" });
    return;
  }

  try {
    const result = await deleteApprovalTemplateHdrService(parseInt(id as string, 10));
    res.json({ success: true, message: result.message });
  } catch (error: any) {
    console.error("DeleteApprovalTemplateHdr error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
