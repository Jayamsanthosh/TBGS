import express from "express";
import {
  getAllEducationQualificationMaster,
  getEducationQualificationMasterById,
  saveEducationQualificationMaster,
  updateEducationQualificationMaster,
  deleteEducationQualificationMaster
} from "../controllers/educationQualificationMaster.controller";

const EducationQualificationMasterRouter = express.Router();

EducationQualificationMasterRouter.get("/", getAllEducationQualificationMaster);
EducationQualificationMasterRouter.get("/:id", getEducationQualificationMasterById);
EducationQualificationMasterRouter.post("/", saveEducationQualificationMaster);
EducationQualificationMasterRouter.put("/:id", updateEducationQualificationMaster);
EducationQualificationMasterRouter.delete("/:id", deleteEducationQualificationMaster);

export default EducationQualificationMasterRouter;
