import express from "express";
import {
  getAllCompanyQuotaAnimalMapping,
  getCompanyQuotaAnimalMappingHdr,
  getCompanyQuotaAnimalMappingDtl,
  saveCompanyQuotaAnimalMapping,
  updateCompanyQuotaAnimalMapping,
  deleteCompanyQuotaAnimalMappingDtl,
  deleteCompanyQuotaAnimalMappingHdr
} from "../controllers/companyQuotaAnimalMappingCombined.controller";

const CompanyQuotaAnimalMappingCombinedRouter = express.Router();

CompanyQuotaAnimalMappingCombinedRouter.get("/", getAllCompanyQuotaAnimalMapping);
CompanyQuotaAnimalMappingCombinedRouter.get("/hdr/:id", getCompanyQuotaAnimalMappingHdr);
CompanyQuotaAnimalMappingCombinedRouter.get("/dtl/:id", getCompanyQuotaAnimalMappingDtl);
CompanyQuotaAnimalMappingCombinedRouter.post("/", saveCompanyQuotaAnimalMapping);
CompanyQuotaAnimalMappingCombinedRouter.put("/:id", updateCompanyQuotaAnimalMapping);
CompanyQuotaAnimalMappingCombinedRouter.delete("/dtl/:sno", deleteCompanyQuotaAnimalMappingDtl);
CompanyQuotaAnimalMappingCombinedRouter.delete("/hdr/:id", deleteCompanyQuotaAnimalMappingHdr);

export default CompanyQuotaAnimalMappingCombinedRouter;
