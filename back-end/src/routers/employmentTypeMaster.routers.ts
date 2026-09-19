import express from "express";
import {
  getAllEmploymentTypeMaster,
  getEmploymentTypeMasterById,
  saveEmploymentTypeMaster,
  updateEmploymentTypeMaster,
  deleteEmploymentTypeMaster
} from "../controllers/employmentTypeMaster.controller";

const EmploymentTypeMasterRouter = express.Router();

EmploymentTypeMasterRouter.get("/", getAllEmploymentTypeMaster);
EmploymentTypeMasterRouter.get("/:id", getEmploymentTypeMasterById);
EmploymentTypeMasterRouter.post("/", saveEmploymentTypeMaster);
EmploymentTypeMasterRouter.put("/:id", updateEmploymentTypeMaster);
EmploymentTypeMasterRouter.delete("/:id", deleteEmploymentTypeMaster);

export default EmploymentTypeMasterRouter;
