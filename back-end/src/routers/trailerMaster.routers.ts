import express from "express";
import {
  getAllTrailerMaster,
  getTrailerMasterById,
  saveTrailerMaster,
  updateTrailerMaster,
  deleteTrailerMaster
} from "../controllers/trailerMaster.controller";

const TrailerMasterRouter = express.Router();

TrailerMasterRouter.get("/", getAllTrailerMaster);
TrailerMasterRouter.get("/:id", getTrailerMasterById);
TrailerMasterRouter.post("/", saveTrailerMaster);
TrailerMasterRouter.put("/:id", updateTrailerMaster);
TrailerMasterRouter.delete("/:id", deleteTrailerMaster);

export default TrailerMasterRouter;
