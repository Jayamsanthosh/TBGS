import express from "express";
import {
  getBatchesBySource,
  getBatch,
  saveBatch,
  updateBatch,
  deleteBatch,
} from "../controllers/batchMaster.controller";

const BatchMasterRouter = express.Router();

BatchMasterRouter.get("/", getBatchesBySource);
BatchMasterRouter.get("/:id", getBatch);
BatchMasterRouter.post("/", saveBatch);
BatchMasterRouter.put("/:id", updateBatch);
BatchMasterRouter.delete("/:id", deleteBatch);

export default BatchMasterRouter;
