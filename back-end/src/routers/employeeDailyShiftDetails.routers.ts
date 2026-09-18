import express from "express";
import {
  getAllEmployeeDailyShiftDetails,
  getEmployeeDailyShiftDetailsById,
  saveEmployeeDailyShiftDetails,
  updateEmployeeDailyShiftDetails,
  deleteEmployeeDailyShiftDetails,
} from "../controllers/employeeDailyShiftDetails.controller";

const EmployeeDailyShiftDetailsRouter = express.Router();

EmployeeDailyShiftDetailsRouter.get("/", getAllEmployeeDailyShiftDetails);
EmployeeDailyShiftDetailsRouter.get("/:id", getEmployeeDailyShiftDetailsById);
EmployeeDailyShiftDetailsRouter.post("/", saveEmployeeDailyShiftDetails);
EmployeeDailyShiftDetailsRouter.put("/:id", updateEmployeeDailyShiftDetails);
EmployeeDailyShiftDetailsRouter.delete("/:id", deleteEmployeeDailyShiftDetails);

export default EmployeeDailyShiftDetailsRouter;
