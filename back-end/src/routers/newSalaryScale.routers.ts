import { Router } from "express";
import {
  getAllNewSalaryScale,
  getNewSalaryScaleById,
  saveNewSalaryScale,
  updateNewSalaryScale,
  deleteNewSalaryScale,
} from "../controllers/newSalaryScale.controller";

const router = Router();

router.get("/", getAllNewSalaryScale);
router.get("/:id", getNewSalaryScaleById);
router.post("/", saveNewSalaryScale);
router.put("/:id", updateNewSalaryScale);
router.delete("/:id", deleteNewSalaryScale);

export default router;
