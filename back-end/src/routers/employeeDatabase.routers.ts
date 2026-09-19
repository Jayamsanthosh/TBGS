import express from "express";
import {
  getAllEmployeeDatabase,
  getEmployeeDatabaseById,
  saveEmployeeDatabase,
  updateEmployeeDatabase,
  deleteEmployeeDatabase
} from "../controllers/employeeDatabase.controller";

const EmployeeDatabaseRouter = express.Router();

EmployeeDatabaseRouter.get("/", getAllEmployeeDatabase);
EmployeeDatabaseRouter.get("/:id", getEmployeeDatabaseById);
EmployeeDatabaseRouter.post("/", saveEmployeeDatabase);
EmployeeDatabaseRouter.put("/:id", updateEmployeeDatabase);
EmployeeDatabaseRouter.delete("/:id", deleteEmployeeDatabase);

export default EmployeeDatabaseRouter;
