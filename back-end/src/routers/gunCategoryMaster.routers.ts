import express from "express";
import {
  getAllGunCategoryMaster,
  getGunCategoryMasterById,
  saveGunCategoryMaster,
  updateGunCategoryMaster,
  deleteGunCategoryMaster
} from "../controllers/gunCategoryMaster.controller";

const GunCategoryMasterRouter = express.Router();

GunCategoryMasterRouter.get("/", getAllGunCategoryMaster);
GunCategoryMasterRouter.get("/:id", getGunCategoryMasterById);
GunCategoryMasterRouter.post("/", saveGunCategoryMaster);
GunCategoryMasterRouter.put("/:id", updateGunCategoryMaster);
GunCategoryMasterRouter.delete("/:id", deleteGunCategoryMaster);

export default GunCategoryMasterRouter;
