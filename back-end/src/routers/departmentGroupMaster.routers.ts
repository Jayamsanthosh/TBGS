import express from "express";
import {
  getAllDepartmentGroupMaster,
  getDepartmentGroupMasterById,
  saveDepartmentGroupMaster,
  updateDepartmentGroupMaster,
  deleteDepartmentGroupMaster
} from "../controllers/departmentGroupMaster.controller";

const DepartmentGroupMasterRouter = express.Router();

DepartmentGroupMasterRouter.get("/", getAllDepartmentGroupMaster);
DepartmentGroupMasterRouter.get("/:id", getDepartmentGroupMasterById);
DepartmentGroupMasterRouter.post("/", saveDepartmentGroupMaster);
DepartmentGroupMasterRouter.put("/:id", updateDepartmentGroupMaster);
DepartmentGroupMasterRouter.delete("/:id", deleteDepartmentGroupMaster);

export default DepartmentGroupMasterRouter;
