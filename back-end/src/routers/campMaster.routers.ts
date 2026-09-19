import express from "express";
import { getAllCampMaster, getCampMasterById, saveCampMaster, updateCampMaster, deleteCampMaster } from "../controllers/campMaster.controller";

const CampMasterRouter = express.Router();

CampMasterRouter.get("/", getAllCampMaster);
CampMasterRouter.get("/:id", getCampMasterById);
CampMasterRouter.post("/", saveCampMaster);
CampMasterRouter.put("/:id", updateCampMaster);
CampMasterRouter.delete("/:id", deleteCampMaster);

export default CampMasterRouter;
