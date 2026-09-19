import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllEducationQualificationMasterService,
  getEducationQualificationMasterByIdService,
  saveEducationQualificationMasterService,
  updateEducationQualificationMasterService,
  deleteEducationQualificationMasterService,
  EducationQualificationMasterData
} from "../services/educationQualificationMaster.services";

export const getAllEducationQualificationMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
    const educationQualifications = await getAllEducationQualificationMasterService(status);
    res.json({ success: true, count: educationQualifications.length, data: educationQualifications });
  } catch (error: any) {
    console.error("GetAllEducationQualificationMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getEducationQualificationMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Education Qualification ID is required" });
    return;
  }

  try {
    const educationQualification = await getEducationQualificationMasterByIdService(parseInt(id as string, 10));

    if (!educationQualification) {
      res.status(404).json({ success: false, message: "Education qualification not found" });
      return;
    }

    res.json({ success: true, data: educationQualification });
  } catch (error: any) {
    console.error("GetEducationQualificationMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveEducationQualificationMaster = async (req: Request, res: Response): Promise<void> => {
  const educationQualificationData: EducationQualificationMasterData = req.body;

  if (!educationQualificationData.EDUCATION_QUALIFICATION_NAME) {
    res.status(400).json({ success: false, message: "Education Qualification Name is required" });
    return;
  }

  try {
    const result = await saveEducationQualificationMasterService(educationQualificationData);
    res.json({ success: true, message: result.message || "Data saved successfully", EDUCATION_QUALIFICATION_ID: result.EDUCATION_QUALIFICATION_ID });
  } catch (error: any) {
    console.error("SaveEducationQualificationMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateEducationQualificationMaster = async (req: Request, res: Response): Promise<void> => {
  const educationQualificationData: EducationQualificationMasterData = req.body;
  const { id } = req.params;

  try {
    if (!educationQualificationData.EDUCATION_QUALIFICATION_ID && id) {
      educationQualificationData.EDUCATION_QUALIFICATION_ID = parseInt(id as string, 10);
    }

    const result = await updateEducationQualificationMasterService(educationQualificationData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateEducationQualificationMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteEducationQualificationMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Education Qualification ID is required" });
    return;
  }

  try {
    const result = await deleteEducationQualificationMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteEducationQualificationMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
