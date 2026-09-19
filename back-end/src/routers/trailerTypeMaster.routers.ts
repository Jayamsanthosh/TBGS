import express from "express";
import {
  getAllTrailerTypeMaster,
  getTrailerTypeMasterById,
  saveTrailerTypeMaster,
  updateTrailerTypeMaster,
  deleteTrailerTypeMaster
} from "../controllers/trailerTypeMaster.controller";

const TrailerTypeMasterRouter = express.Router();

TrailerTypeMasterRouter.get("/", getAllTrailerTypeMaster);
TrailerTypeMasterRouter.get("/:id", getTrailerTypeMasterById);
TrailerTypeMasterRouter.post("/", saveTrailerTypeMaster);
TrailerTypeMasterRouter.put("/:id", updateTrailerTypeMaster);
TrailerTypeMasterRouter.delete("/:id", deleteTrailerTypeMaster);

export default TrailerTypeMasterRouter;
