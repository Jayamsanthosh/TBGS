import { Router } from "express";
import {
  getAllGunMaster,
  getGunMasterById,
  saveGunMaster,
  updateGunMaster,
  deleteGunMaster,
} from "../controllers/gunMaster.controller";

const router = Router();

router.get("/", getAllGunMaster);
router.get("/:id", getGunMasterById);
router.post("/", saveGunMaster);
router.put("/:id", updateGunMaster);
router.delete("/:id", deleteGunMaster);

export default router;
