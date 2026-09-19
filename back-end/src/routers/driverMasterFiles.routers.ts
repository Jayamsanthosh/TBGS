import express from "express";
import {
  getAllFiles,
  getFilesByDriver,
  getFileById,
  saveFile,
  updateFile,
  deleteFile
} from "../controllers/driverMasterFiles.controller";

const DriverMasterFilesRouter = express.Router();

DriverMasterFilesRouter.get("/", getAllFiles);
DriverMasterFilesRouter.get("/by-driver", getFilesByDriver);
DriverMasterFilesRouter.get("/:sno", getFileById);
DriverMasterFilesRouter.post("/", saveFile);
DriverMasterFilesRouter.put("/:sno", updateFile);
DriverMasterFilesRouter.delete("/:sno", deleteFile);

export default DriverMasterFilesRouter;
