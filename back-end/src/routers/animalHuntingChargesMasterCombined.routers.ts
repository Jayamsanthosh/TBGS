import express from "express";
import {
  getAllAnimalHuntingChargesMaster,
  getAnimalHuntingChargesMasterHdr,
  getAnimalHuntingChargesMasterDtl,
  saveAnimalHuntingChargesMaster,
  updateAnimalHuntingChargesMaster,
  submitAnimalHuntingChargesMaster,
  deleteAnimalHuntingChargesMasterDtl,
  deleteAnimalHuntingChargesMasterHdr
} from "../controllers/animalHuntingChargesMasterCombined.controller";

const AnimalHuntingChargesMasterCombinedRouter = express.Router();

AnimalHuntingChargesMasterCombinedRouter.get("/", getAllAnimalHuntingChargesMaster);
AnimalHuntingChargesMasterCombinedRouter.get("/hdr/:id", getAnimalHuntingChargesMasterHdr);
AnimalHuntingChargesMasterCombinedRouter.get("/dtl/:id", getAnimalHuntingChargesMasterDtl);
AnimalHuntingChargesMasterCombinedRouter.post("/", saveAnimalHuntingChargesMaster);
AnimalHuntingChargesMasterCombinedRouter.post("/:id/submit", submitAnimalHuntingChargesMaster);
AnimalHuntingChargesMasterCombinedRouter.put("/:id", updateAnimalHuntingChargesMaster);
AnimalHuntingChargesMasterCombinedRouter.delete("/dtl/:sno", deleteAnimalHuntingChargesMasterDtl);
AnimalHuntingChargesMasterCombinedRouter.delete("/hdr/:id", deleteAnimalHuntingChargesMasterHdr);

export default AnimalHuntingChargesMasterCombinedRouter;
