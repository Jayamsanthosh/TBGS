import { Request, Response } from "express";
import {
  resolveRequestType,
  mapApprovalStatus,
  getApprovalSummaryService,
  getRequestListService,
  getRequestDetailService,
  updateRequestStatusService,
  validateActionableRequests,
  getApprovalFileService,
} from "../services/approval.services";

interface CardDefaults {
  sno: number;
  routeSlug: string;
  iconKey: string;
  permissionColumn: string;
  backgroundColor: string;
  approvalType: string;
}

const CARD_DEFAULTS: Record<string, CardDefaults> = {
  "Attendance Request": {
    sno: 1,
    routeSlug: "attendance",
    iconKey: "CalendarCheck",
    permissionColumn: "attendance",
    backgroundColor: "indigo",
    approvalType: "Attendance Request",
  },
  "Cash Advance Request": {
    sno: 2,
    routeSlug: "cash-advance",
    iconKey: "Wallet",
    permissionColumn: "cashAdvance",
    backgroundColor: "emerald",
    approvalType: "Cash Advance Request",
  },
  "Arrears Request": {
    sno: 3,
    routeSlug: "arrears",
    iconKey: "BadgeDollarSign",
    permissionColumn: "arrears",
    backgroundColor: "amber",
    approvalType: "Arrears Request",
  },
  "Overtime Request": {
    sno: 4,
    routeSlug: "overtime",
    iconKey: "Timer",
    permissionColumn: "overtime",
    backgroundColor: "sky",
    approvalType: "Overtime Request",
  },
  "Bonus Request": {
    sno: 5,
    routeSlug: "bonus",
    iconKey: "Gift",
    permissionColumn: "bonus",
    backgroundColor: "fuchsia",
    approvalType: "Bonus Request",
  },
  "Leave Encashment Request": {
    sno: 6,
    routeSlug: "leave-encashment",
    iconKey: "CalendarClock",
    permissionColumn: "leaveEncashment",
    backgroundColor: "teal",
    approvalType: "Leave Encashment Request",
  },
  "Promotion Demotion Transfer Request": {
    sno: 7,
    routeSlug: "promotion-demotion-transfer",
    iconKey: "ArrowRightLeft",
    permissionColumn: "promotionDemotionTransfer",
    backgroundColor: "rose",
    approvalType: "Promotion Demotion Transfer Request",
  },
  /* Purchase Request is the non-HR card. It keeps the same panel chrome, but
     its list/detail/update all go through VPurchase procs. */
  "Purchase Request": {
    sno: 8,
    routeSlug: "purchase-request",
    iconKey: "ShoppingCart",
    permissionColumn: "purchaseRequest",
    backgroundColor: "blue",
    approvalType: "Purchase Request",
  },
  /* Purchase Quotation is the priced sibling of the request: same three-level
     chain, its own header table and its own update proc. */
  "Purchase Quotation": {
    sno: 9,
    routeSlug: "purchase-quotation",
    iconKey: "FileSpreadsheet",
    permissionColumn: "purchaseQuotation",
    backgroundColor: "violet",
    approvalType: "Purchase Quotation",
  },
  /* Purchase Order closes the purchase chain: it is raised from a quotation and
     approved by the same three levels through its own VPurchase procs. */
  "Purchase Order": {
    sno: 10,
    routeSlug: "purchase-order",
    iconKey: "Package",
    permissionColumn: "purchaseOrder",
    backgroundColor: "orange",
    approvalType: "Purchase Order",
  },
};

const getCurrentUser = (req: Request): string => {
  const user = (req as any).user;
  return user?.loginName || (user?.sub != null ? String(user.sub) : "Admin");
};

export const getDashboardCards = async (req: Request, res: Response): Promise<void> => {
  try {
    const rows = await getApprovalSummaryService();
    const cards = rows
      .filter((r: any) => CARD_DEFAULTS[r.CardName])
      .map((r: any) => ({
        ...CARD_DEFAULTS[r.CardName],
        cardTitle: r.CardName,
        pendingCount: Number(r.PendingCount ?? 0),
        approvedCount: Number(r.ApprovedCount ?? 0),
        holdCount: Number(r.HoldCount ?? 0),
        rejectedCount: Number(r.RejectedCount ?? 0),
        totalCount:
          Number(r.PendingCount ?? 0) +
          Number(r.ApprovedCount ?? 0) +
          Number(r.HoldCount ?? 0) +
          Number(r.RejectedCount ?? 0),
        parentId: null,
      }));
    res.json(cards);
  } catch (error: any) {
    console.error("Dashboard cards error:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to load cards" });
  }
};

export const getDashboardCounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const rows = await getApprovalSummaryService();
    const counts: Record<string, number> = {};
    for (const r of rows) {
      const def = CARD_DEFAULTS[r.CardName];
      if (!def) continue;
      const pending = Number(r.PendingCount ?? 0);
      counts[def.routeSlug] = pending;
      counts[def.approvalType] = pending;
      counts[def.permissionColumn] = pending;
    }
    res.json(counts);
  } catch (error: any) {
    console.error("Dashboard counts error:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to load counts" });
  }
};

export const getRequestList = async (req: Request, res: Response): Promise<void> => {
  try {
    const requestType = resolveRequestType(String(req.params.type));
    if (!requestType) {
      res.status(400).json({ success: false, message: "Unknown approval type" });
      return;
    }
    const status = (req.query.status as string) || "ALL";
    const rows = await getRequestListService(requestType, status);
    res.json(rows);
  } catch (error: any) {
    console.error("Approval list error:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to load records" });
  }
};

export const getRequestDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const requestType = resolveRequestType(String(req.params.type));
    if (!requestType) {
      res.status(400).json({ success: false, message: "Unknown approval type" });
      return;
    }
    const sno = Number(String(req.params.id));
    if (isNaN(sno)) {
      res.status(400).json({ success: false, message: "Invalid record id" });
      return;
    }
    const detail = await getRequestDetailService(requestType, sno);
    if (!detail) {
      res.status(404).json({ success: false, message: "Record not found" });
      return;
    }
    res.json(detail);
  } catch (error: any) {
    console.error("Approval detail error:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to load detail" });
  }
};

export const getConversation = async (_req: Request, res: Response): Promise<void> => {
  res.json([]);
};

/**
 * Streams one attached document to the approval app. The response is the raw
 * file (not base64 JSON) so a PDF or image can be opened straight from a blob
 * URL without inflating it by a third on the way out.
 */
export const getApprovalFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(String(req.params.id));
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ success: false, message: "Invalid document id" });
      return;
    }

    const file = await getApprovalFileService(id);
    if (!file) {
      res.status(404).json({ success: false, message: "Document not found" });
      return;
    }

    /* A filename is echoed in a header, so it has to be reduced to printable
       ASCII: CR/LF would split the response and a quote would end the value.
       The original name still travels in the RFC 5987 filename* parameter. */
    const asciiName = file.fileName
      .replace(/[^\x20-\x7E]/g, "_")
      .replace(/["\\]/g, "_");
    const encodedName = encodeURIComponent(file.fileName);
    res.setHeader("Content-Type", file.contentType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${asciiName}"; filename*=UTF-8''${encodedName}`
    );
    res.setHeader("Content-Length", String(file.buffer.length));
    res.setHeader("Cache-Control", "private, max-age=300");
    res.send(file.buffer);
  } catch (error: any) {
    console.error("Approval file error:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to load document" });
  }
};

const runStatusUpdate = async (
  req: Request,
  res: Response,
  requestType: string | undefined
): Promise<void> => {
  try {
    const resolvedType = requestType ? resolveRequestType(requestType) : null;
    if (!resolvedType) {
      res.status(400).json({ success: false, message: "Unknown approval type" });
      return;
    }

    const { ids, status, remarks } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ success: false, message: "ids[] is required" });
      return;
    }
    const spStatus = mapApprovalStatus(status);
    if (!spStatus) {
      res.status(400).json({ success: false, message: "status must be APPROVED, REJECTED or HOLD" });
      return;
    }

    const updatedBy = getCurrentUser(req);
    // Purchase Request stamps the approver's EMP_ID and IP on the level row.
    // The login name is not numeric, so the EMP_ID has to come from the token.
    const user = (req as any).user;
    const tokenEmpId = user?.employee?.empId;
    const updatedByEmpId =
      tokenEmpId === null || tokenEmpId === undefined || tokenEmpId === ""
        ? null
        : Number(tokenEmpId);
    const approverIp =
      String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
      req.ip ||
      null;

    // Pre-validate the whole batch BEFORE applying anything so a single
    // non-actionable row cannot cause a partial apply (some ids changed,
    // others left untouched) followed by a 500. Mirrors UPDATE_REQUEST_STATUS
    // level logic so mid-flow requests (e.g. section head already approved)
    // are still actionable.
    const notActionable = await validateActionableRequests(
      resolvedType,
      ids.map((id: any) => Number(id))
    );
    if (notActionable.length > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot update ${notActionable.length} of ${ids.length} request(s): ${notActionable.length > 1 ? "they are" : "it is"} already fully approved/rejected or has no pending approval level (SNO: ${notActionable.join(", ")}). Only requests with a pending or held level can be updated.`,
      });
      return;
    }

    const results: string[] = [];
    for (const id of ids) {
      const result = await updateRequestStatusService({
        requestType: resolvedType,
        sno: Number(id),
        status: spStatus,
        updatedBy,
        holdReason: remarks,
        updatedByEmpId,
        approverIp,
      });
      results.push(result.message);
    }

    res.json({ success: true, message: results.join(" | ") });
  } catch (error: any) {
    console.error("Approval status update error:", error);
    // Stored procedures report validation failures (missing Hold reason, no
    // pending level left) through parseSprocResult, which marks them 400. Pass
    // that through so the panel shows a validation message instead of a 500.
    res
      .status(Number(error?.httpStatus) || 500)
      .json({ success: false, message: error?.message || "Failed to update status" });
  }
};

export const updateStatusByType = async (req: Request, res: Response): Promise<void> => {
  await runStatusUpdate(req, res, String(req.params.type));
};

export const updateStatusByBody = async (req: Request, res: Response): Promise<void> => {
  const type = req.body?.type || req.body?.requestType;
  await runStatusUpdate(req, res, type);
};