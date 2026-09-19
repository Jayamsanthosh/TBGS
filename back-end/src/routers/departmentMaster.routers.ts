import express from "express";
import {
  getAllDepartmentMaster,
  getDepartmentMasterById,
  saveDepartmentMaster,
  updateDepartmentMaster,
  deleteDepartmentMaster
} from "../controllers/departmentMaster.controller";

const DepartmentMasterRouter = express.Router();

DepartmentMasterRouter.get("/", getAllDepartmentMaster);
DepartmentMasterRouter.get("/:id", getDepartmentMasterById);
DepartmentMasterRouter.post("/", saveDepartmentMaster);
DepartmentMasterRouter.put("/:id", updateDepartmentMaster);
DepartmentMasterRouter.delete("/:id", deleteDepartmentMaster);

export default DepartmentMasterRouter;
