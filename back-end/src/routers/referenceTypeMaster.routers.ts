import express from "express";
import {
  getAllReferenceTypeMaster,
  getReferenceTypeMasterById,
  getReferenceTypeMasterLoad,
  saveReferenceTypeMaster,
  updateReferenceTypeMaster,
  deleteReferenceTypeMaster
} from "../controllers/referenceTypeMaster.controller";

const ReferenceTypeMasterRouter = express.Router();

ReferenceTypeMasterRouter.get("/", getAllReferenceTypeMaster);
ReferenceTypeMasterRouter.get("/load", getReferenceTypeMasterLoad);
ReferenceTypeMasterRouter.get("/:id", getReferenceTypeMasterById);
ReferenceTypeMasterRouter.post("/", saveReferenceTypeMaster);
ReferenceTypeMasterRouter.put("/:id", updateReferenceTypeMaster);
ReferenceTypeMasterRouter.delete("/:id", deleteReferenceTypeMaster);

export default ReferenceTypeMasterRouter;