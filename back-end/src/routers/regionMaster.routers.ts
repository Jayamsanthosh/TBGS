import express from "express";
import { getAllRegionMaster, getRegionMasterById, saveRegionMaster, updateRegionMaster, deleteRegionMaster } from "../controllers/regionMaster.controller";

const RegionMasterRouter = express.Router();

RegionMasterRouter.get("/", getAllRegionMaster);
RegionMasterRouter.get("/:id", getRegionMasterById);
RegionMasterRouter.post("/", saveRegionMaster);
RegionMasterRouter.put("/:id", updateRegionMaster);
RegionMasterRouter.delete("/:id", deleteRegionMaster);

export default RegionMasterRouter;
