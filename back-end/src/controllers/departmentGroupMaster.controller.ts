import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllDepartmentGroupMasterService,
  getDepartmentGroupMasterByIdService,
  saveDepartmentGroupMasterService,
  updateDepartmentGroupMasterService,
  deleteDepartmentGroupMasterService,
  DepartmentGroupMasterData
} from "../services/departmentGroupMaster.services";

export const getAllDepartmentGroupMaster = async (_req: Request, res: Response): Promise<void> => {
  try {
    const departmentGroups = await getAllDepartmentGroupMasterService();
    res.json({ success: true, count: departmentGroups.length, data: departmentGroups });
  } catch (error: any) {
    console.error("GetAllDepartmentGroupMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getDepartmentGroupMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Department Group ID is required" });
    return;
  }

  try {
    const departmentGroup = await getDepartmentGroupMasterByIdService(parseInt(id as string, 10));

    if (!departmentGroup) {
      res.status(404).json({ success: false, message: "Department group not found" });
      return;
    }

    res.json({ success: true, data: departmentGroup });
  } catch (error: any) {
    console.error("GetDepartmentGroupMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveDepartmentGroupMaster = async (req: Request, res: Response): Promise<void> => {
  const departmentGroupData: DepartmentGroupMasterData = req.body;

  if (!departmentGroupData.DEPARTMENT_GROUP_NAME) {
    res.status(400).json({ success: false, message: "Department Group Name is required" });
    return;
  }

  try {
    const result = await saveDepartmentGroupMasterService(departmentGroupData);
    res.json({ success: true, message: result.message || "Department group saved successfully" });
  } catch (error: any) {
    console.error("SaveDepartmentGroupMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateDepartmentGroupMaster = async (req: Request, res: Response): Promise<void> => {
  const departmentGroupData: DepartmentGroupMasterData = req.body;
  const { id } = req.params;

  try {
    if (!departmentGroupData.DEPARTMENT_GROUP_ID && id) {
      departmentGroupData.DEPARTMENT_GROUP_ID = parseInt(id as string, 10);
    }

    const result = await updateDepartmentGroupMasterService(departmentGroupData);
    res.json({ success: true, message: result.message || "Department group updated successfully" });
  } catch (error: any) {
    console.error("UpdateDepartmentGroupMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteDepartmentGroupMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Department Group ID is required" });
    return;
  }

  try {
    const result = await deleteDepartmentGroupMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Department group deleted successfully" });
  } catch (error: any) {
    console.error("DeleteDepartmentGroupMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
