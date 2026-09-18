import express from "express";
import {
  getAllEmployeeContractTypeMaster,
  getEmployeeContractTypeMasterById,
  saveEmployeeContractTypeMaster,
  updateEmployeeContractTypeMaster,
  deleteEmployeeContractTypeMaster
} from "../controllers/employeeContractTypeMaster.controller";

const EmployeeContractTypeMasterRouter = express.Router();

EmployeeContractTypeMasterRouter.get("/", getAllEmployeeContractTypeMaster);
EmployeeContractTypeMasterRouter.get("/:id", getEmployeeContractTypeMasterById);
EmployeeContractTypeMasterRouter.post("/", saveEmployeeContractTypeMaster);
EmployeeContractTypeMasterRouter.put("/:id", updateEmployeeContractTypeMaster);
EmployeeContractTypeMasterRouter.delete("/:id", deleteEmployeeContractTypeMaster);

export default EmployeeContractTypeMasterRouter;
