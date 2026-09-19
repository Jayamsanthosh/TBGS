import { Router } from "express";
import {
  getAllCompanyBankAccountMaster,
  getCompanyBankAccountMasterById,
  saveCompanyBankAccountMaster,
  updateCompanyBankAccountMaster,
  deleteCompanyBankAccountMaster,
} from "../controllers/companyBankAccountMaster.controller";

const router = Router();

router.get("/", getAllCompanyBankAccountMaster);
router.get("/:id", getCompanyBankAccountMasterById);
router.post("/", saveCompanyBankAccountMaster);
router.put("/:id", updateCompanyBankAccountMaster);
router.delete("/:id", deleteCompanyBankAccountMaster);

export default router;
