import { Router } from "express";
import {
  getAllAirportMaster,
  getAirportMasterById,
  saveAirportMaster,
  updateAirportMaster,
  deleteAirportMaster,
} from "../controllers/airportMaster.controller";

const router = Router();

router.get("/", getAllAirportMaster);
router.get("/:id", getAirportMasterById);
router.post("/", saveAirportMaster);
router.put("/:id", updateAirportMaster);
router.delete("/:id", deleteAirportMaster);

export default router;
