import { Router } from "express";
import {
  getAllAnimalPartsMaster,
  getAnimalPartsMasterById,
  saveAnimalPartsMaster,
  updateAnimalPartsMaster,
  deleteAnimalPartsMaster,
} from "../controllers/animalPartsMaster.controller";

const router = Router();

router.get("/", getAllAnimalPartsMaster);
router.get("/:id", getAnimalPartsMasterById);
router.post("/", saveAnimalPartsMaster);
router.put("/:id", updateAnimalPartsMaster);
router.delete("/:id", deleteAnimalPartsMaster);

export default router;
