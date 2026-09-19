import express from "express";
import {
  getReports,
  getReportTypes,
  getReportFilters,
  getReportParameters,
  getInsightCards,
  getInsightRecords,
  getReportMasterList,
  getReportMasterItem,
  saveReportMaster,
  updateReportMaster,
  deleteReportMaster,
} from "../controllers/report.controller";

const ReportRouter = express.Router();

ReportRouter.get("/types", getReportTypes);
ReportRouter.get("/filters", getReportFilters);
ReportRouter.get("/parameters", getReportParameters);
ReportRouter.get("/reports", getReports);
ReportRouter.get("/cards", getInsightCards);
ReportRouter.get("/records/:cardKey", getInsightRecords);

ReportRouter.get("/master", getReportMasterList);
ReportRouter.get("/master/:id", getReportMasterItem);
ReportRouter.post("/master", saveReportMaster);
ReportRouter.put("/master/:id", updateReportMaster);
ReportRouter.delete("/master/:id", deleteReportMaster);

export default ReportRouter;
