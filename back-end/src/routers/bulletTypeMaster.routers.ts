import express from "express";
import { getAllBulletTypeMaster, getBulletTypeMasterById, saveBulletTypeMaster, updateBulletTypeMaster, deleteBulletTypeMaster } from "../controllers/bulletTypeMaster.controller";

const BulletTypeMasterRouter = express.Router();

BulletTypeMasterRouter.get("/", getAllBulletTypeMaster);
BulletTypeMasterRouter.get("/:id", getBulletTypeMasterById);
BulletTypeMasterRouter.post("/", saveBulletTypeMaster);
BulletTypeMasterRouter.put("/:id", updateBulletTypeMaster);
BulletTypeMasterRouter.delete("/:id", deleteBulletTypeMaster);

export default BulletTypeMasterRouter;
