import express from "express";
import {
  getAllGuideMaster,
  getGuideMasterById,
  saveGuideMaster,
  updateGuideMaster,
  deleteGuideMaster,
} from "../controllers/guideMaster.controller";

const GuideMasterRouter = express.Router();

GuideMasterRouter.get("/", getAllGuideMaster);
GuideMasterRouter.get("/:id", getGuideMasterById);
GuideMasterRouter.post("/", saveGuideMaster);
GuideMasterRouter.put("/:id", updateGuideMaster);
GuideMasterRouter.delete("/:id", deleteGuideMaster);

export default GuideMasterRouter;
