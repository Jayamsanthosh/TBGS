import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllEmploymentTypeMasterService,
  getEmploymentTypeMasterByIdService,
  saveEmploymentTypeMasterService,
  updateEmploymentTypeMasterService,
  deleteEmploymentTypeMasterService,
  EmploymentTypeMasterData
} from "../services/employmentTypeMaster.services";

export const getAllEmploymentTypeMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
    const employmentTypes = await getAllEmploymentTypeMasterService(status);
    res.json({ success: true, count: employmentTypes.length, data: employmentTypes });
  } catch (error: any) {
    console.error("GetAllEmploymentTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getEmploymentTypeMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Employment Type ID is required" });
    return;
  }

  try {
    const employmentType = await getEmploymentTypeMasterByIdService(parseInt(id as string, 10));

    if (!employmentType) {
      res.status(404).json({ success: false, message: "Employment type not found" });
      return;
    }

    res.json({ success: true, data: employmentType });
  } catch (error: any) {
    console.error("GetEmploymentTypeMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveEmploymentTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const employmentTypeData: EmploymentTypeMasterData = req.body;

  if (!employmentTypeData.EMPLOYMENT_TYPE_NAME) {
    res.status(400).json({ success: false, message: "Employment Type Name is required" });
    return;
  }

  try {
    const result = await saveEmploymentTypeMasterService(employmentTypeData);
    res.json({ success: true, message: result.message || "Data saved successfully", EMPLOYMENT_TYPE_ID: result.EMPLOYMENT_TYPE_ID });
  } catch (error: any) {
    console.error("SaveEmploymentTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateEmploymentTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const employmentTypeData: EmploymentTypeMasterData = req.body;
  const { id } = req.params;

  try {
    if (!employmentTypeData.EMPLOYMENT_TYPE_ID && id) {
      employmentTypeData.EMPLOYMENT_TYPE_ID = parseInt(id as string, 10);
    }

    const result = await updateEmploymentTypeMasterService(employmentTypeData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateEmploymentTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteEmploymentTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Employment Type ID is required" });
    return;
  }

  try {
    const result = await deleteEmploymentTypeMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteEmploymentTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
