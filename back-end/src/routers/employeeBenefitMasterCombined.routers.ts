import express from "express";
import {
  getAllEmployeeBenefitMaster,
  getEmployeeBenefitMasterHdr,
  getEmployeeBenefitMasterDtl,
  saveEmployeeBenefitMaster,
  updateEmployeeBenefitMaster,
  deleteEmployeeBenefitMasterDtl,
  deleteEmployeeBenefitMasterHdr
} from "../controllers/employeeBenefitMasterCombined.controller";

const EmployeeBenefitMasterCombinedRouter = express.Router();

EmployeeBenefitMasterCombinedRouter.get("/", getAllEmployeeBenefitMaster);
EmployeeBenefitMasterCombinedRouter.get("/hdr/:refNo", getEmployeeBenefitMasterHdr);
EmployeeBenefitMasterCombinedRouter.get("/dtl/:sno", getEmployeeBenefitMasterDtl);
EmployeeBenefitMasterCombinedRouter.post("/", saveEmployeeBenefitMaster);
EmployeeBenefitMasterCombinedRouter.put("/:refNo", updateEmployeeBenefitMaster);
EmployeeBenefitMasterCombinedRouter.delete("/dtl/:sno", deleteEmployeeBenefitMasterDtl);
EmployeeBenefitMasterCombinedRouter.delete("/hdr/:refNo", deleteEmployeeBenefitMasterHdr);

export default EmployeeBenefitMasterCombinedRouter;
