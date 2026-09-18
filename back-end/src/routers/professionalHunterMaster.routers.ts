import express from "express";
import { getAllProfessionalHunterMaster, getProfessionalHunterMasterById, saveProfessionalHunterMaster, updateProfessionalHunterMaster, deleteProfessionalHunterMaster } from "../controllers/professionalHunterMaster.controller";

const ProfessionalHunterMasterRouter = express.Router();

ProfessionalHunterMasterRouter.get("/", getAllProfessionalHunterMaster);
ProfessionalHunterMasterRouter.get("/:id", getProfessionalHunterMasterById);
ProfessionalHunterMasterRouter.post("/", saveProfessionalHunterMaster);
ProfessionalHunterMasterRouter.put("/:id", updateProfessionalHunterMaster);
ProfessionalHunterMasterRouter.delete("/:id", deleteProfessionalHunterMaster);

export default ProfessionalHunterMasterRouter;
