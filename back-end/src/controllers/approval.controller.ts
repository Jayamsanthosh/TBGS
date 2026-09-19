import { Request, Response } from "express";
import {
  resolveRequestType,
  mapApprovalStatus,
  getApprovalSummaryService,
  getRequestListService,
  getRequestDetailService,
  updateRequestStatusService,
  validateActionableRequests,
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
      });
      results.push(result.message);
    }

    res.json({ success: true, message: results.join(" | ") });
  } catch (error: any) {
    console.error("Approval status update error:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to update status" });
  }
};

export const updateStatusByType = async (req: Request, res: Response): Promise<void> => {
  await runStatusUpdate(req, res, String(req.params.type));
};

export const updateStatusByBody = async (req: Request, res: Response): Promise<void> => {
  const type = req.body?.type || req.body?.requestType;
  await runStatusUpdate(req, res, type);
};