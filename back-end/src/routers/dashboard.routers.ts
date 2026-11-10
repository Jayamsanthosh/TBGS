import express from "express";
import {
  getDashboardCards,
  getDashboardCounts,
  getDashboardRequests,
} from "../controllers/approval.controller";

const DashboardRouter = express.Router();

DashboardRouter.get("/cards", getDashboardCards);
DashboardRouter.get("/counts", getDashboardCounts);
DashboardRouter.get("/requests/:type", getDashboardRequests);

export default DashboardRouter;
