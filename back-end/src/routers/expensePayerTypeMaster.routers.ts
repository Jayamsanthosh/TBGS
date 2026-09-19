import express from "express";
import { getAllExpensePayerTypeMaster, getExpensePayerTypeMasterById, saveExpensePayerTypeMaster, updateExpensePayerTypeMaster, deleteExpensePayerTypeMaster } from "../controllers/expensePayerTypeMaster.controller";

const ExpensePayerTypeMasterRouter = express.Router();

ExpensePayerTypeMasterRouter.get("/", getAllExpensePayerTypeMaster);
ExpensePayerTypeMasterRouter.get("/:id", getExpensePayerTypeMasterById);
ExpensePayerTypeMasterRouter.post("/", saveExpensePayerTypeMaster);
ExpensePayerTypeMasterRouter.put("/:id", updateExpensePayerTypeMaster);
ExpensePayerTypeMasterRouter.delete("/:id", deleteExpensePayerTypeMaster);

export default ExpensePayerTypeMasterRouter;