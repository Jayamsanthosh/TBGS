import express from "express";
import { getAllAmmunitionBrandMaster, getAmmunitionBrandMasterById, saveAmmunitionBrandMaster, updateAmmunitionBrandMaster, deleteAmmunitionBrandMaster } from "../controllers/ammunitionBrandMaster.controller";

const AmmunitionBrandMasterRouter = express.Router();

AmmunitionBrandMasterRouter.get("/", getAllAmmunitionBrandMaster);
AmmunitionBrandMasterRouter.get("/:id", getAmmunitionBrandMasterById);
AmmunitionBrandMasterRouter.post("/", saveAmmunitionBrandMaster);
AmmunitionBrandMasterRouter.put("/:id", updateAmmunitionBrandMaster);
AmmunitionBrandMasterRouter.delete("/:id", deleteAmmunitionBrandMaster);

export default AmmunitionBrandMasterRouter;
