import express from "express";
import {
  getAllVisaTypeMaster,
  getVisaTypeMasterById,
  saveVisaTypeMaster,
  updateVisaTypeMaster,
  deleteVisaTypeMaster
} from "../controllers/visaTypeMaster.controller";

const VisaTypeMasterRouter = express.Router();

VisaTypeMasterRouter.get("/", getAllVisaTypeMaster);
VisaTypeMasterRouter.get("/:id", getVisaTypeMasterById);
VisaTypeMasterRouter.post("/", saveVisaTypeMaster);
VisaTypeMasterRouter.put("/:id", updateVisaTypeMaster);
VisaTypeMasterRouter.delete("/:id", deleteVisaTypeMaster);

export default VisaTypeMasterRouter;
