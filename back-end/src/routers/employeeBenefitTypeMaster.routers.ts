import express from "express";
import {
  getAllEmployeeBenefitTypeMaster,
  getEmployeeBenefitTypeMasterById,
  saveEmployeeBenefitTypeMaster,
  updateEmployeeBenefitTypeMaster,
  deleteEmployeeBenefitTypeMaster,
} from "../controllers/employeeBenefitTypeMaster.controller";

const EmployeeBenefitTypeMasterRouter = express.Router();

EmployeeBenefitTypeMasterRouter.get("/", getAllEmployeeBenefitTypeMaster);
EmployeeBenefitTypeMasterRouter.get("/:id", getEmployeeBenefitTypeMasterById);
EmployeeBenefitTypeMasterRouter.post("/", saveEmployeeBenefitTypeMaster);
EmployeeBenefitTypeMasterRouter.put("/:id", updateEmployeeBenefitTypeMaster);
EmployeeBenefitTypeMasterRouter.delete("/:id", deleteEmployeeBenefitTypeMaster);

export default EmployeeBenefitTypeMasterRouter;