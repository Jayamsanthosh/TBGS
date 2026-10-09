import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  getPurchaseRequestListService,
  getPurchaseRequestHdrService,
  getPurchaseRequestDtlsService,
  getPurchaseRequestDtlService,
  getPurchaseRequestRefNumbersService,
  savePurchaseRequestCombinedService,
  updatePurchaseRequestCombinedService,
  deletePurchaseRequestDtlService,
  deletePurchaseRequestHdrService,
  loadPurchaseRequestOptionsService,
  submitPurchaseRequestService,
  PurchaseRequestData
} from "../services/purchaseRequestMaster.services";

const toPositiveInt = (v: any): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
};

/**
 * Stamps the requester from the verified session and reports whether the caller
 * has a usable identity.
 *
 * The requester is whoever is logged in, so it must never be taken from the body -
 * that would let anyone raise a request in a colleague's name. It has to resolve to
 * a *name*, but deliberately not to an employee id: a login with no employee record
 * is still allowed to raise a request and is stored with a null id plus its login
 * name. An access token issued before this change carries no employee block, so a
 * missing session is reported rather than silently trusted from the client.
 */
const applySessionRequester = (
  req: Request,
  res: Response,
  data: PurchaseRequestData
): boolean => {
  const sessionEmployee = (req as any).user?.employee ?? null;
  const empName = String(sessionEmployee?.empName ?? "").trim();

  if (!empName) {
    res.status(401).json({
      success: false,
      message: "Your login could not be resolved to a requester. Please sign in again.",
    });
    return false;
  }

  data.sessionEmployee = { empId: sessionEmployee?.empId ?? null, empName };
  return true;
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
  const { companyId, statusEntry, approvalStatus, includeInactive, finalResponseStatus } = req.query;

  try {
    const options = await loadPurchaseRequestOptionsService(
      toPositiveInt(companyId),
      typeof statusEntry === "string" ? statusEntry || null : null,
      typeof approvalStatus === "string" ? approvalStatus || null : null,
      includeInactive === "true" || includeInactive === "1",
      typeof finalResponseStatus === "string" ? finalResponseStatus || null : null
    );
    res.json({ success: true, count: options.length, data: options });
  } catch (error: any) {
    console.error("GetPurchaseRequestLoad error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPurchaseRequestRefNumbers = async (req: Request, res: Response): Promise<void> => {
  const { referenceTypeId } = req.query;

  try {
    const data = await getPurchaseRequestRefNumbersService(toPositiveInt(referenceTypeId));
    res.json({ success: true, count: data.length, data });
  } catch (error: any) {
    console.error("GetPurchaseRequestRefNumbers error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const savePurchaseRequest = async (req: Request, res: Response): Promise<void> => {
  const data: PurchaseRequestData = req.body;

  if (!data.PURCHASE_REQUEST_DATE) {
    res.status(400).json({ success: false, message: "Purchase Request Date is required" });
    return;
  }
  if (!applySessionRequester(req, res, data)) return;
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
  if (!applySessionRequester(req, res, data)) return;
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

export const submitPurchaseRequest = async (req: Request, res: Response): Promise<void> => {
  const { refNo } = req.params;
  const { USER, MAC_ADDRESS } = identityFrom(req);
  const statusId = toPositiveInt(req.body?.statusId);

  if (!refNo) {
    res.status(400).json({ success: false, message: "Purchase Request no is required" });
    return;
  }

  if (!statusId) {
    res.status(400).json({ success: false, message: "statusId is required to submit" });
    return;
  }

  try {
    const result = await submitPurchaseRequestService(
      refNo as string,
      statusId,
      USER || "Admin",
      MAC_ADDRESS || "WEB"
    );
    res.json({
      success: true,
      message: result.message,
      changed: result.changed,
      purchaseRequest: result.purchaseRequest,
    });
  } catch (error: any) {
    console.error("SubmitPurchaseRequest error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};