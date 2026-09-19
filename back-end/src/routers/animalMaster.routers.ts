import express from "express";
import { getAllAnimalMaster, getAnimalMasterById, saveAnimalMaster, updateAnimalMaster, deleteAnimalMaster } from "../controllers/animalMaster.controller";

const AnimalMasterRouter = express.Router();

AnimalMasterRouter.get("/", getAllAnimalMaster);
AnimalMasterRouter.get("/:id", getAnimalMasterById);
AnimalMasterRouter.post("/", saveAnimalMaster);
AnimalMasterRouter.put("/:id", updateAnimalMaster);
AnimalMasterRouter.delete("/:id", deleteAnimalMaster);

export default AnimalMasterRouter;
