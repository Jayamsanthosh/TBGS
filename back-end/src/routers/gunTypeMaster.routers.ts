import express from "express";
import {
  getAllGunTypeMaster,
  getGunTypeMasterById,
  saveGunTypeMaster,
  updateGunTypeMaster,
  deleteGunTypeMaster
} from "../controllers/gunTypeMaster.controller";

const GunTypeMasterRouter = express.Router();

GunTypeMasterRouter.get("/", getAllGunTypeMaster);
GunTypeMasterRouter.get("/:id", getGunTypeMasterById);
GunTypeMasterRouter.post("/", saveGunTypeMaster);
GunTypeMasterRouter.put("/:id", updateGunTypeMaster);
GunTypeMasterRouter.delete("/:id", deleteGunTypeMaster);

export default GunTypeMasterRouter;
