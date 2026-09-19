import express from "express";
import {
  getAllEmployeeWorkingStatusMaster,
  getEmployeeWorkingStatusMasterById,
  saveEmployeeWorkingStatusMaster,
  updateEmployeeWorkingStatusMaster,
  deleteEmployeeWorkingStatusMaster
} from "../controllers/employeeWorkingStatusMaster.controller";

const EmployeeWorkingStatusMasterRouter = express.Router();

EmployeeWorkingStatusMasterRouter.get("/", getAllEmployeeWorkingStatusMaster);
EmployeeWorkingStatusMasterRouter.get("/:id", getEmployeeWorkingStatusMasterById);
EmployeeWorkingStatusMasterRouter.post("/", saveEmployeeWorkingStatusMaster);
EmployeeWorkingStatusMasterRouter.put("/:id", updateEmployeeWorkingStatusMaster);
EmployeeWorkingStatusMasterRouter.delete("/:id", deleteEmployeeWorkingStatusMaster);

export default EmployeeWorkingStatusMasterRouter;
