import { Router } from "express";
import {
  getAllVideographerMaster,
  getVideographerMasterById,
  saveVideographerMaster,
  updateVideographerMaster,
  deleteVideographerMaster,
} from "../controllers/videographerMaster.controller";

const router = Router();

router.get("/", getAllVideographerMaster);
router.get("/:id", getVideographerMasterById);
router.post("/", saveVideographerMaster);
router.put("/:id", updateVideographerMaster);
router.delete("/:id", deleteVideographerMaster);

export default router;
