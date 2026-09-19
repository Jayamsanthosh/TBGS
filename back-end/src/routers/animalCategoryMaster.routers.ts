import { Router } from "express";
import {
  getAllAnimalCategoryMaster,
  getAnimalCategoryMasterById,
  saveAnimalCategoryMaster,
  updateAnimalCategoryMaster,
  deleteAnimalCategoryMaster,
} from "../controllers/animalCategoryMaster.controller";

const router = Router();

router.get("/", getAllAnimalCategoryMaster);
router.get("/:id", getAnimalCategoryMasterById);
router.post("/", saveAnimalCategoryMaster);
router.put("/:id", updateAnimalCategoryMaster);
router.delete("/:id", deleteAnimalCategoryMaster);

export default router;