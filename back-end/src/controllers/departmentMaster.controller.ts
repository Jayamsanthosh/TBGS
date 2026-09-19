import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllDepartmentMasterService,
  getDepartmentMasterByIdService,
  saveDepartmentMasterService,
  updateDepartmentMasterService,
  deleteDepartmentMasterService,
  DepartmentMasterData
} from "../services/departmentMaster.services";

export const getAllDepartmentMaster = async (_req: Request, res: Response): Promise<void> => {
  try {
    const departments = await getAllDepartmentMasterService();
    res.json({ success: true, count: departments.length, data: departments });
  } catch (error: any) {
    console.error("GetAllDepartmentMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getDepartmentMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Department ID is required" });
    return;
  }

  try {
    const department = await getDepartmentMasterByIdService(parseInt(id as string, 10));

    if (!department) {
      res.status(404).json({ success: false, message: "Department not found" });
      return;
    }

    res.json({ success: true, data: department });
  } catch (error: any) {
    console.error("GetDepartmentMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveDepartmentMaster = async (req: Request, res: Response): Promise<void> => {
  const departmentData: DepartmentMasterData = req.body;

  if (!departmentData.DEPARTMENT_NAME) {
    res.status(400).json({ success: false, message: "Department Name is required" });
    return;
  }

  try {
    const result = await saveDepartmentMasterService(departmentData);
    res.json({ success: true, message: result.message || "Department saved successfully" });
  } catch (error: any) {
    console.error("SaveDepartmentMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateDepartmentMaster = async (req: Request, res: Response): Promise<void> => {
  const departmentData: DepartmentMasterData = req.body;
  const { id } = req.params;

  try {
    if (!departmentData.DEPARTMENT_ID && id) {
      departmentData.DEPARTMENT_ID = parseInt(id as string, 10);
    }

    const result = await updateDepartmentMasterService(departmentData);
    res.json({ success: true, message: result.message || "Department updated successfully" });
  } catch (error: any) {
    console.error("UpdateDepartmentMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteDepartmentMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Department ID is required" });
    return;
  }

  try {
    const result = await deleteDepartmentMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Department deleted successfully" });
  } catch (error: any) {
    console.error("DeleteDepartmentMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
