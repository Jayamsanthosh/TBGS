import express from "express";
import { getAllDistrictMaster, getDistrictMasterById, saveDistrictMaster, updateDistrictMaster, deleteDistrictMaster } from "../controllers/districtMaster.controller";

const DistrictMasterRouter = express.Router();

DistrictMasterRouter.get("/", getAllDistrictMaster);
DistrictMasterRouter.get("/:id", getDistrictMasterById);
DistrictMasterRouter.post("/", saveDistrictMaster);
DistrictMasterRouter.put("/:id", updateDistrictMaster);
DistrictMasterRouter.delete("/:id", deleteDistrictMaster);

export default DistrictMasterRouter;
