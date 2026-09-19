import express from "express";
import { getAllGunBrandMaster, getGunBrandMasterById, saveGunBrandMaster, updateGunBrandMaster, deleteGunBrandMaster } from "../controllers/gunBrandMaster.controller";

const GunBrandMasterRouter = express.Router();

GunBrandMasterRouter.get("/", getAllGunBrandMaster);
GunBrandMasterRouter.get("/:id", getGunBrandMasterById);
GunBrandMasterRouter.post("/", saveGunBrandMaster);
GunBrandMasterRouter.put("/:id", updateGunBrandMaster);
GunBrandMasterRouter.delete("/:id", deleteGunBrandMaster);

export default GunBrandMasterRouter;
