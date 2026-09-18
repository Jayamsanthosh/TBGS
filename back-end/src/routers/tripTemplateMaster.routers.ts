import express from "express";
import {
  getAllTripTemplateMaster,
  getTripTemplateMasterById,
  saveTripTemplateMaster,
  updateTripTemplateMaster,
  deleteTripTemplateMaster
} from "../controllers/tripTemplateMaster.controller";

const TripTemplateMasterRouter = express.Router();

TripTemplateMasterRouter.get("/", getAllTripTemplateMaster);
TripTemplateMasterRouter.get("/:id", getTripTemplateMasterById);
TripTemplateMasterRouter.post("/", saveTripTemplateMaster);
TripTemplateMasterRouter.put("/:id", updateTripTemplateMaster);
TripTemplateMasterRouter.delete("/:id", deleteTripTemplateMaster);

export default TripTemplateMasterRouter;
