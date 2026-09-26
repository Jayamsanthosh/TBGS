import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  getPurchaseRequestListService,
  getPurchaseRequestHdrService,
  getPurchaseRequestDtlsService,
  getPurchaseRequestDtlService,
  savePurchaseRequestCombinedService,
  updatePurchaseRequestCombinedService,
  deletePurchaseRequestDtlService,
  deletePurchaseRequestHdrService,
  loadPurchaseRequestOptionsService,
  PurchaseRequestData
} from "../services/purchaseRequestMaster.services";

const toPositiveInt = (v: any): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
};

export const getAllPurchaseRequest = async (req: Request, res: Response): Promise<void> => {
  const { status, search, fromDate, toDate, companyId, storeId, campId, branchId, page, pageSize } =
    req.query;

  try {
    const result = await getPurchaseRequestListService({
      status: typeof status === "string" ? status : "ALL",
      search: typeof search === "string" ? search : null,
      fromDate: typeof fromDate === "string" ? fromDate : null,
      toDate: typeof toDate === "string" ? toDate : null,
      companyId: toPositiveInt(companyId),
      storeId: toPositiveInt(storeId),
      campId: toPositiveInt(campId),
      branchId: toPositiveInt(branchId),
      page: toPositiveInt(page),
      pageSize: toPositiveInt(pageSize),
    });
    res.json({ success: true, total: result.total, count: result.rows.length, data: result.rows });
  } catch (error: any) {
    console.error("GetAllPurchaseRequest error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPurchaseRequestHdr = async (req: Request, res: Response): Promise<void> => {
  const { refNo } = req.params;

  if (!refNo) {
    res.status(400).json({ success: false, message: "Purchase Request no is required" });
    return;
  }

  try {
    const data = await getPurchaseRequestHdrService(refNo as string);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("GetPurchaseRequestHdr error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPurchaseRequestDtls = async (req: Request, res: Response): Promise<void> => {
  const { refNo } = req.params;

  if (!refNo) {
    res.status(400).json({ success: false, message: "Purchase Request no is required" });
    return;
  }

  try {
    const data = await getPurchaseRequestDtlsService(refNo as string);
    res.json({ success: true, count: data.length, data });
  } catch (error: any) {
    console.error("GetPurchaseRequestDtls error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPurchaseRequestDtl = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const dtlId = toPositiveInt(id);

  if (!dtlId) {
    res.status(400).json({ success: false, message: "Valid purchase request detail id is required" });
    return;
  }

  try {
    const data = await getPurchaseRequestDtlService(dtlId);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("GetPurchaseRequestDtl error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPurchaseRequestLoad = async (req: Request, res: Response): Promise<void> => {
  const { companyId, statusEntry, approvalStatus, includeInactive } = req.query;

  try {
    const options = await loadPurchaseRequestOptionsService(
      toPositiveInt(companyId),
      typeof statusEntry === "string" ? statusEntry || null : null,
      typeof approvalStatus === "string" ? approvalStatus || null : null,
      includeInactive === "true" || includeInactive === "1"
    );
    res.json({ success: true, count: options.length, data: options });
  } catch (error: any) {
    console.error("GetPurchaseRequestLoad error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const savePurchaseRequest = async (req: Request, res: Response): Promise<void> => {
  const data: PurchaseRequestData = req.body;

  if (!data.PURCHASE_REQUEST_DATE) {
    res.status(400).json({ success: false, message: "Purchase Request Date is required" });
    return;
  }
  if (!data.REQUESTED_BY_EMP_ID) {
    res.status(400).json({ success: false, message: "Requested By Employee is required" });
    return;
  }
  if (!data.COMPANY_ID) {
    res.status(400).json({ success: false, message: "Company is required" });
    return;
  }

  const dtls = Array.isArray(data.dtls) ? data.dtls : [];
  if (!dtls.length) {
    res.status(400).json({
      success: false,
      message: "At least one purchase request detail line is required",
    });
    return;
  }

  try {
    const result = await savePurchaseRequestCombinedService(data);
    res.json({
      success: true,
      message: result.message || "Purchase Request created successfully",
      PURCHASE_REQUEST_NO: result.PURCHASE_REQUEST_NO,
    });
  } catch (error: any) {
    console.error("SavePurchaseRequest error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updatePurchaseRequest = async (req: Request, res: Response): Promise<void> => {
  const data: PurchaseRequestData = req.body;
  const { refNo } = req.params;

  if (!data.PURCHASE_REQUEST_DATE) {
    res.status(400).json({ success: false, message: "Purchase Request Date is required" });
    return;
  }
  if (!data.REQUESTED_BY_EMP_ID) {
    res.status(400).json({ success: false, message: "Requested By Employee is required" });
    return;
  }
  if (!data.COMPANY_ID) {
    res.status(400).json({ success: false, message: "Company is required" });
    return;
  }

  try {
    if (!data.PURCHASE_REQUEST_NO && refNo) {
      data.PURCHASE_REQUEST_NO = refNo as string;
    }

    const result = await updatePurchaseRequestCombinedService(data);
    res.json({ success: true, message: result.message || "Purchase Request updated successfully" });
  } catch (error: any) {
    console.error("UpdatePurchaseRequest error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deletePurchaseRequestDtl = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);
  const dtlId = toPositiveInt(id);

  if (!dtlId) {
    res.status(400).json({ success: false, message: "Valid purchase request detail id is required" });
    return;
  }

  try {
    const result = await deletePurchaseRequestDtlService(
      dtlId,
      USER || "Admin",
      ROLE || "Admin",
      MAC_ADDRESS || "WEB"
    );
    res.json({ success: true, message: result.message || "Purchase Request detail deleted successfully" });
  } catch (error: any) {
    console.error("DeletePurchaseRequestDtl error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deletePurchaseRequestHdr = async (req: Request, res: Response): Promise<void> => {
  const { refNo } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!refNo) {
    res.status(400).json({ success: false, message: "Purchase Request no is required" });
    return;
  }

  try {
    const result = await deletePurchaseRequestHdrService(
      refNo as string,
      USER || "Admin",
      ROLE || "Admin",
      MAC_ADDRESS || "WEB"
    );
    res.json({ success: true, message: result.message || "Purchase Request deleted successfully" });
  } catch (error: any) {
    console.error("DeletePurchaseRequestHdr error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};