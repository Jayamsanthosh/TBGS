import express from "express";
import {
  getAllCashAdvances,
  getCashAdvanceById,
  saveCashAdvance,
  updateCashAdvance,
  deleteCashAdvance
} from "../controllers/cashAdvance.controller";

const CashAdvanceRouter = express.Router();

CashAdvanceRouter.get("/", getAllCashAdvances);
CashAdvanceRouter.get("/:id", getCashAdvanceById);
CashAdvanceRouter.post("/", saveCashAdvance);
CashAdvanceRouter.put("/:id", updateCashAdvance);
CashAdvanceRouter.delete("/:id", deleteCashAdvance);

export default CashAdvanceRouter;