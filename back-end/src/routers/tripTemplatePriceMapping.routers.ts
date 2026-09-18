import express from "express";
import {
  getAllTripTemplatePriceMapping,
  saveTripTemplatePriceMapping,
  updateTripTemplatePriceMapping,
  deleteTripTemplatePriceMapping
} from "../controllers/tripTemplatePriceMapping.controller";

const TripTemplatePriceMappingRouter = express.Router();

TripTemplatePriceMappingRouter.get("/", getAllTripTemplatePriceMapping);
TripTemplatePriceMappingRouter.post("/", saveTripTemplatePriceMapping);
TripTemplatePriceMappingRouter.put("/:id", updateTripTemplatePriceMapping);
TripTemplatePriceMappingRouter.delete("/:id", deleteTripTemplatePriceMapping);

export default TripTemplatePriceMappingRouter;
