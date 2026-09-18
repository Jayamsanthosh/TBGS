import express from "express";
import {
  getAllDesignationMaster,
  getDesignationMasterById,
  saveDesignationMaster,
  updateDesignationMaster,
  deleteDesignationMaster
} from "../controllers/designationMaster.controller";

const DesignationMasterRouter = express.Router();

DesignationMasterRouter.get("/", getAllDesignationMaster);
DesignationMasterRouter.get("/:id", getDesignationMasterById);
DesignationMasterRouter.post("/", saveDesignationMaster);
DesignationMasterRouter.put("/:id", updateDesignationMaster);
DesignationMasterRouter.delete("/:id", deleteDesignationMaster);

export default DesignationMasterRouter;
