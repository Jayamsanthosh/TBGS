import express from "express";
import {
  getFilesByTrailer,
  getFileById,
  saveFile,
  updateFile,
  deleteFile
} from "../controllers/trailerMasterFiles.controller";

const TrailerMasterFilesRouter = express.Router();

TrailerMasterFilesRouter.get("/", getFilesByTrailer);
TrailerMasterFilesRouter.get("/:sno", getFileById);
TrailerMasterFilesRouter.post("/", saveFile);
TrailerMasterFilesRouter.put("/:sno", updateFile);
TrailerMasterFilesRouter.delete("/:sno", deleteFile);

export default TrailerMasterFilesRouter;
