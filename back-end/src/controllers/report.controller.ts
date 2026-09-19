import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getReportDataService,
  getReportPageService,
  getReportFilterOptionsService,
  getInsightCardsService,
  getInsightRecordsService,
  getReportTypesService,
  getReportParametersService,
  getReportMasterService,
  getReportMasterByIdService,
  saveReportMasterService,
  updateReportMasterService,
  deleteReportMasterService,
  validateReportStoredProcedure,
  INVALID_CARD_KEY,
  ReportMasterData,
} from "../services/report.services";

export const getReports = async (req: Request, res: Response) => {
  try {
    const { requestType, fromDate, toDate, status, refNo, employeeSearch, company, store, camp, department, search, export: exportFlag } = req.query;

    if (!requestType || typeof requestType !== "string") {
      res.status(400).json({ message: "requestType is required" });
      return;
    }

    const reportTypes = await getReportTypesService();
    const validType = reportTypes.find((t) => t.value === requestType);
    if (!validType) {
      res.status(400).json({ message: `Invalid requestType. Allowed: ${reportTypes.map((t) => t.value).join(", ")}` });
      return;
    }

    const base = {
      requestType,
      fromDate: typeof fromDate === "string" ? fromDate : undefined,
      toDate: typeof toDate === "string" ? toDate : undefined,
      status: typeof status === "string" ? status : undefined,
      refNo: typeof refNo === "string" ? refNo : undefined,
      employeeSearch: typeof employeeSearch === "string" ? employeeSearch : undefined,
      companyId: typeof company === "string" && company ? company : undefined,
      storeId: typeof store === "string" && store ? store : undefined,
      campId: typeof camp === "string" && camp ? camp : undefined,
      departmentId: typeof department === "string" && department ? department : undefined,
      search: typeof search === "string" && search ? search : undefined,
    };

    // CSV-export style requests bypass pagination and return every matching row.
    if (exportFlag === "1" || exportFlag === "true") {
      const { rows, columns } = await getReportDataService(base);
      res.json({ data: rows, columns });
      return;
    }

    let page = 1;
    if (typeof req.query.page === "string") {
      const parsed = parseInt(req.query.page, 10);
      page = isNaN(parsed) ? 1 : Math.max(1, parsed);
    }

    let pageSize = 10;
    if (typeof req.query.pageSize === "string") {
      const parsed = parseInt(req.query.pageSize, 10);
      pageSize = isNaN(parsed) ? 10 : Math.min(100, Math.max(1, parsed));
    }

    const result = await getReportPageService({ ...base, page, pageSize });
    res.json({ data: result.rows, total: result.total, page, pageSize, columns: result.columns });
  } catch (error) {
    console.error("Report fetch error:", error);
    const detail = error instanceof Error ? error.message : String(error);
    res.status(500).json({ message: `Failed to fetch report data: ${detail}` });
  }
};

export const getReportTypes = async (_req: Request, res: Response) => {
  try {
    const types = await getReportTypesService();
    res.json(types);
  } catch (error) {
    console.error("Report types fetch error:", error);
    res.status(500).json({ message: "Failed to fetch report types" });
  }
};

export const getReportFilters = async (_req: Request, res: Response) => {
  try {
    const data = await getReportFilterOptionsService();
    res.json(data);
  } catch (error) {
    console.error("Report filters fetch error:", error);
    res.status(500).json({ message: "Failed to fetch report filters" });
  }
};

export const getReportParameters = async (req: Request, res: Response) => {
  try {
    const { requestType } = req.query;
    if (!requestType || typeof requestType !== "string") {
      res.status(400).json({ success: false, message: "requestType is required" });
      return;
    }
    const reportTypes = await getReportTypesService();
    const validType = reportTypes.find((t) => t.value === requestType);
    if (!validType) {
      res.status(400).json({ success: false, message: `Invalid requestType. Allowed: ${reportTypes.map((t) => t.value).join(", ")}` });
      return;
    }
    const data = await getReportParametersService(requestType);
    res.json({ success: true, data });
  } catch (error) {
    console.error("Report parameters fetch error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch report parameters" });
  }
};

export const getInsightCards = async (_req: Request, res: Response) => {
  try {
    const cards = await getInsightCardsService({});
    res.json({ data: cards });
  } catch (error) {
    console.error("Insight cards fetch error:", error);
    res.status(500).json({ message: "Failed to fetch insight cards" });
  }
};

export const getInsightRecords = async (req: Request, res: Response) => {
  try {
    const { cardKey } = req.params;
    if (!cardKey || INVALID_CARD_KEY(cardKey)) {
      res.status(400).json({ message: `Invalid cardKey. Allowed: one of the 24 insight card keys` });
      return;
    }

    if (typeof req.query.status === "string" && req.query.status.length > 30) {
      res.status(400).json({ message: "status too long" });
      return;
    }

    if (typeof req.query.search === "string" && req.query.search.length > 100) {
      res.status(400).json({ message: "search too long" });
      return;
    }

    let page = 1;
    if (typeof req.query.page === "string") {
      const parsed = parseInt(req.query.page, 10);
      page = isNaN(parsed) ? 1 : Math.max(1, parsed);
    }

    let pageSize = 10;
    if (typeof req.query.pageSize === "string") {
      const parsed = parseInt(req.query.pageSize, 10);
      pageSize = isNaN(parsed) ? 10 : Math.min(100, Math.max(1, parsed));
    }

    const result = await getInsightRecordsService({
      cardKey,
      status: typeof req.query.status === "string" ? req.query.status : "ALL",
      search: typeof req.query.search === "string" ? req.query.search : "",
      fromDate: typeof req.query.fromDate === "string" && req.query.fromDate.trim() ? req.query.fromDate.trim() : undefined,
      toDate: typeof req.query.toDate === "string" && req.query.toDate.trim() ? req.query.toDate.trim() : undefined,
      page,
      pageSize,
      sortBy: typeof req.query.sortBy === "string" ? req.query.sortBy : "",
      sortDir: req.query.sortDir === "ASC" ? "ASC" : "DESC",
    });

    res.json({ data: result.rows, total: result.total, page, pageSize });
  } catch (error) {
    console.error("Insight records fetch error:", error);
    res.status(500).json({ message: "Failed to fetch insight records" });
  }
};

// ------------------- Report Master CRUD -------------------

export const getReportMasterList = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : "ALL";
    const reports = await getReportMasterService(status);
    res.json({ success: true, count: reports.length, data: reports });
  } catch (error: any) {
    console.error("GetReportMasterList error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getReportMasterItem = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ success: false, message: "Report ID is required" });
    return;
  }
  try {
    const report = await getReportMasterByIdService(parseInt(id as string, 10));
    if (!report) {
      res.status(404).json({ success: false, message: "Report not found" });
      return;
    }
    res.json({ success: true, data: report });
  } catch (error: any) {
    console.error("GetReportMasterItem error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveReportMaster = async (req: Request, res: Response): Promise<void> => {
  const data: ReportMasterData = req.body;
  const identity = identityFrom(req);
  if (!data.REPORT_NAME) {
    res.status(400).json({ success: false, message: "Report Name is required" });
    return;
  }
  const procCheck = await validateReportStoredProcedure(String(data.PROCEDURE_NAME || ""));
  if (!procCheck.ok) {
    res.status(400).json({ success: false, message: procCheck.message });
    return;
  }
  try {
    const message = await saveReportMasterService(data, {
      user: identity.USER || "",
      role: identity.ROLE || "",
      macAddress: identity.MAC_ADDRESS || "",
    });
    res.json({ success: true, message });
  } catch (error: any) {
    console.error("SaveReportMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateReportMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const data: ReportMasterData = req.body;
  const identity = identityFrom(req);
  const procCheck = await validateReportStoredProcedure(String(data.PROCEDURE_NAME || ""));
  if (!procCheck.ok) {
    res.status(400).json({ success: false, message: procCheck.message });
    return;
  }
  try {
    const message = await updateReportMasterService(parseInt(id as string, 10), data, {
      user: identity.USER || "",
      role: identity.ROLE || "",
      macAddress: identity.MAC_ADDRESS || "",
    });
    res.json({ success: true, message });
  } catch (error: any) {
    console.error("UpdateReportMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteReportMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const identity = identityFrom(req);
  if (!id) {
    res.status(400).json({ success: false, message: "Report ID is required" });
    return;
  }
  try {
    const message = await deleteReportMasterService(parseInt(id as string, 10), {
      user: identity.USER || "",
      role: identity.ROLE || "",
      macAddress: identity.MAC_ADDRESS || "",
    });
    res.json({ success: true, message });
  } catch (error: any) {
    console.error("DeleteReportMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
