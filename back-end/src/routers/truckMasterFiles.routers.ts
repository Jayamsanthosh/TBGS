import express from "express";
import {
  getAllFiles,
  getFilesByTruck,
  getFileById,
  saveFile,
  updateFile,
  deleteFile
} from "../controllers/truckMasterFiles.controller";

const TruckMasterFilesRouter = express.Router();

TruckMasterFilesRouter.get("/", getAllFiles);
TruckMasterFilesRouter.get("/by-truck", getFilesByTruck);
TruckMasterFilesRouter.get("/:sno", getFileById);
TruckMasterFilesRouter.post("/", saveFile);
TruckMasterFilesRouter.put("/:sno", updateFile);
TruckMasterFilesRouter.delete("/:sno", deleteFile);

export default TruckMasterFilesRouter;
