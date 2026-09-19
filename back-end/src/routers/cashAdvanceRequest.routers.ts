import express from "express";
import {
  getAllCashAdvanceRequest,
  getCashAdvanceRequestById,
  saveCashAdvanceRequest,
  updateCashAdvanceRequest,
  deleteCashAdvanceRequest,
  submitCashAdvanceRequest,
} from "../controllers/cashAdvanceRequest.controller";

const CashAdvanceRequestRouter = express.Router();

CashAdvanceRequestRouter.get("/", getAllCashAdvanceRequest);
CashAdvanceRequestRouter.get("/:id", getCashAdvanceRequestById);
CashAdvanceRequestRouter.post("/", saveCashAdvanceRequest);
CashAdvanceRequestRouter.post("/:id/submit", submitCashAdvanceRequest);
CashAdvanceRequestRouter.put("/:id", updateCashAdvanceRequest);
CashAdvanceRequestRouter.delete("/:id", deleteCashAdvanceRequest);

export default CashAdvanceRequestRouter;