import { Router } from "express";
import {
  getAllMassagerMaster,
  getMassagerMasterById,
  saveMassagerMaster,
  updateMassagerMaster,
  deleteMassagerMaster,
} from "../controllers/massagerMaster.controller";

const router = Router();

router.get("/", getAllMassagerMaster);
router.get("/:id", getMassagerMasterById);
router.post("/", saveMassagerMaster);
router.put("/:id", updateMassagerMaster);
router.delete("/:id", deleteMassagerMaster);

export default router;
