import { Router } from "express";
import {
  getAllBulletMaster,
  getBulletMasterById,
  saveBulletMaster,
  updateBulletMaster,
  deleteBulletMaster,
} from "../controllers/bulletMaster.controller";

const router = Router();

router.get("/", getAllBulletMaster);
router.get("/:id", getBulletMasterById);
router.post("/", saveBulletMaster);
router.put("/:id", updateBulletMaster);
router.delete("/:id", deleteBulletMaster);

export default router;
