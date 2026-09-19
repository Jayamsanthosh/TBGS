import express from "express";
import {
  getDashboardCards,
  getDashboardCounts,
} from "../controllers/approval.controller";

const DashboardRouter = express.Router();

DashboardRouter.get("/cards", getDashboardCards);
DashboardRouter.get("/counts", getDashboardCounts);

export default DashboardRouter;