import express from "express";
import { getAllCompanyMaster, getCompanyMasterById, saveCompanyMaster, updateCompanyMaster, deleteCompanyMaster } from "../controllers/companyMaster.controller";

const CompanyMasterRouter = express.Router();

CompanyMasterRouter.get("/", getAllCompanyMaster);
CompanyMasterRouter.get("/:id", getCompanyMasterById);
CompanyMasterRouter.post("/", saveCompanyMaster);
CompanyMasterRouter.put("/:id", updateCompanyMaster);
CompanyMasterRouter.delete("/:id", deleteCompanyMaster);

export default CompanyMasterRouter;
