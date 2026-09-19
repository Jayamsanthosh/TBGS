import express from "express";
import {
  getAllMonthlyAutoDeductions,
  getMonthlyAutoDeductionById,
  saveMonthlyAutoDeduction,
  updateMonthlyAutoDeduction,
  submitMonthlyAutoDeduction,
  deleteMonthlyAutoDeduction,
} from "../controllers/monthlyAutoDeduction.controller";

const MonthlyAutoDeductionRouter = express.Router();

MonthlyAutoDeductionRouter.get("/", getAllMonthlyAutoDeductions);
MonthlyAutoDeductionRouter.get("/:id", getMonthlyAutoDeductionById);
MonthlyAutoDeductionRouter.post("/", saveMonthlyAutoDeduction);
MonthlyAutoDeductionRouter.post("/:id/submit", submitMonthlyAutoDeduction);
MonthlyAutoDeductionRouter.put("/:id", updateMonthlyAutoDeduction);
MonthlyAutoDeductionRouter.delete("/:id", deleteMonthlyAutoDeduction);

export default MonthlyAutoDeductionRouter;
