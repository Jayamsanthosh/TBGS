import express from "express";
import {
  getAllBusBoardingLocationMaster,
  getBusBoardingLocationMasterById,
  saveBusBoardingLocationMaster,
  updateBusBoardingLocationMaster,
  deleteBusBoardingLocationMaster
} from "../controllers/busBoardingLocationMaster.controller";

const BusBoardingLocationMasterRouter = express.Router();

BusBoardingLocationMasterRouter.get("/", getAllBusBoardingLocationMaster);
BusBoardingLocationMasterRouter.get("/:id", getBusBoardingLocationMasterById);
BusBoardingLocationMasterRouter.post("/", saveBusBoardingLocationMaster);
BusBoardingLocationMasterRouter.put("/:id", updateBusBoardingLocationMaster);
BusBoardingLocationMasterRouter.delete("/:id", deleteBusBoardingLocationMaster);

export default BusBoardingLocationMasterRouter;
