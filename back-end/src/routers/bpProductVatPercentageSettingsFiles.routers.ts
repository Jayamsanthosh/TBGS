import express from "express";
import {
  getFilesBySetting,
  getFileById,
  saveFile,
  updateFile,
  deleteFile
} from "../controllers/bpProductVatPercentageSettingsFiles.controller";

const BpProductVatFilesRouter = express.Router();

BpProductVatFilesRouter.get("/by-setting", getFilesBySetting);
BpProductVatFilesRouter.get("/:sno", getFileById);
BpProductVatFilesRouter.post("/", saveFile);
BpProductVatFilesRouter.put("/:sno", updateFile);
BpProductVatFilesRouter.delete("/:sno", deleteFile);

export default BpProductVatFilesRouter;
