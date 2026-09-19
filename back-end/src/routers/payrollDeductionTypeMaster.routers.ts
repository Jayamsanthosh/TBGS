import express from "express";
import {
  getAllPayrollDeductionTypeMaster,
  getPayrollDeductionTypeMasterById,
  savePayrollDeductionTypeMaster,
  updatePayrollDeductionTypeMaster,
  deletePayrollDeductionTypeMaster,
} from "../controllers/payrollDeductionTypeMaster.controller";

const PayrollDeductionTypeMasterRouter = express.Router();

PayrollDeductionTypeMasterRouter.get("/", getAllPayrollDeductionTypeMaster);
PayrollDeductionTypeMasterRouter.get("/:id", getPayrollDeductionTypeMasterById);
PayrollDeductionTypeMasterRouter.post("/", savePayrollDeductionTypeMaster);
PayrollDeductionTypeMasterRouter.put("/:id", updatePayrollDeductionTypeMaster);
PayrollDeductionTypeMasterRouter.delete("/:id", deletePayrollDeductionTypeMaster);

export default PayrollDeductionTypeMasterRouter;