import express from "express";
import { getAllStoreMaster, getStoreMasterById, saveStoreMaster, updateStoreMaster, deleteStoreMaster } from "../controllers/storeMaster.controller";

const StoreMasterRouter = express.Router();

StoreMasterRouter.get("/", getAllStoreMaster);
StoreMasterRouter.get("/:id", getStoreMasterById);
StoreMasterRouter.post("/", saveStoreMaster);
StoreMasterRouter.put("/:id", updateStoreMaster);
StoreMasterRouter.delete("/:id", deleteStoreMaster);

export default StoreMasterRouter;
