import express from "express";
import { getAllAntiPoachingFindingsMaster, getAntiPoachingFindingsMasterById, saveAntiPoachingFindingsMaster, updateAntiPoachingFindingsMaster, deleteAntiPoachingFindingsMaster } from "../controllers/antiPoachingFindingsMaster.controller";

const AntiPoachingFindingsMasterRouter = express.Router();

AntiPoachingFindingsMasterRouter.get("/", getAllAntiPoachingFindingsMaster);
AntiPoachingFindingsMasterRouter.get("/:id", getAntiPoachingFindingsMasterById);
AntiPoachingFindingsMasterRouter.post("/", saveAntiPoachingFindingsMaster);
AntiPoachingFindingsMasterRouter.put("/:id", updateAntiPoachingFindingsMaster);
AntiPoachingFindingsMasterRouter.delete("/:id", deleteAntiPoachingFindingsMaster);

export default AntiPoachingFindingsMasterRouter;
