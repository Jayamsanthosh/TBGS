import express from "express";
import { getAllUomMaster, getUomMasterById, saveUomMaster, updateUomMaster, deleteUomMaster } from "../controllers/uomMaster.controller";

const UomMasterRouter = express.Router();

UomMasterRouter.get("/", getAllUomMaster);
UomMasterRouter.get("/:id", getUomMasterById);
UomMasterRouter.post("/", saveUomMaster);
UomMasterRouter.put("/:id", updateUomMaster);
UomMasterRouter.delete("/:id", deleteUomMaster);

export default UomMasterRouter;
