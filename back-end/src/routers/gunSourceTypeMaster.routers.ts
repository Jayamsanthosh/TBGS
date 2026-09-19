import { Router } from "express";
import {
  getAllGunSourceTypeMaster,
  getGunSourceTypeMasterById,
  saveGunSourceTypeMaster,
  updateGunSourceTypeMaster,
  deleteGunSourceTypeMaster,
} from "../controllers/gunSourceTypeMaster.controller";

const router = Router();

router.get("/", getAllGunSourceTypeMaster);
router.get("/:id", getGunSourceTypeMasterById);
router.post("/", saveGunSourceTypeMaster);
router.put("/:id", updateGunSourceTypeMaster);
router.delete("/:id", deleteGunSourceTypeMaster);

export default router;