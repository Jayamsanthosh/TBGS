import express from "express";
import {
  getAllAnimalHuntingChargesMaster,
  getAnimalHuntingChargesMasterHdr,
  getAnimalHuntingChargesMasterDtl,
  saveAnimalHuntingChargesMaster,
  updateAnimalHuntingChargesMaster,
  deleteAnimalHuntingChargesMasterDtl,
  deleteAnimalHuntingChargesMasterHdr
} from "../controllers/animalHuntingChargesMasterCombined.controller";

const AnimalHuntingChargesMasterCombinedRouter = express.Router();

AnimalHuntingChargesMasterCombinedRouter.get("/", getAllAnimalHuntingChargesMaster);
AnimalHuntingChargesMasterCombinedRouter.get("/hdr/:id", getAnimalHuntingChargesMasterHdr);
AnimalHuntingChargesMasterCombinedRouter.get("/dtl/:id", getAnimalHuntingChargesMasterDtl);
AnimalHuntingChargesMasterCombinedRouter.post("/", saveAnimalHuntingChargesMaster);
AnimalHuntingChargesMasterCombinedRouter.put("/:id", updateAnimalHuntingChargesMaster);
AnimalHuntingChargesMasterCombinedRouter.delete("/dtl/:sno", deleteAnimalHuntingChargesMasterDtl);
AnimalHuntingChargesMasterCombinedRouter.delete("/hdr/:id", deleteAnimalHuntingChargesMasterHdr);

export default AnimalHuntingChargesMasterCombinedRouter;
