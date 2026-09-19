import { Router } from "express";
import {
  getAllBankMaster,
  getBankMasterById,
  saveBankMaster,
  updateBankMaster,
  deleteBankMaster,
} from "../controllers/bankMaster.controller";

const router = Router();

router.get("/", getAllBankMaster);
router.get("/:id", getBankMasterById);
router.post("/", saveBankMaster);
router.put("/:id", updateBankMaster);
router.delete("/:id", deleteBankMaster);

export default router;
