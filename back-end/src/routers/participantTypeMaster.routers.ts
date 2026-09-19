import express from "express";
import { getAllParticipantTypeMaster, getParticipantTypeMasterById, saveParticipantTypeMaster, updateParticipantTypeMaster, deleteParticipantTypeMaster } from "../controllers/participantTypeMaster.controller";

const ParticipantTypeMasterRouter = express.Router();

ParticipantTypeMasterRouter.get("/", getAllParticipantTypeMaster);
ParticipantTypeMasterRouter.get("/:id", getParticipantTypeMasterById);
ParticipantTypeMasterRouter.post("/", saveParticipantTypeMaster);
ParticipantTypeMasterRouter.put("/:id", updateParticipantTypeMaster);
ParticipantTypeMasterRouter.delete("/:id", deleteParticipantTypeMaster);

export default ParticipantTypeMasterRouter;