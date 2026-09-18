import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllEmployeeWorkingStatusMasterService,
  getEmployeeWorkingStatusMasterByIdService,
  saveEmployeeWorkingStatusMasterService,
  updateEmployeeWorkingStatusMasterService,
  deleteEmployeeWorkingStatusMasterService,
  EmployeeWorkingStatusMasterData
} from "../services/employeeWorkingStatusMaster.services";

export const getAllEmployeeWorkingStatusMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const statuses = await getAllEmployeeWorkingStatusMasterService(status || undefined);
    res.json({ success: true, count: statuses.length, data: statuses });
  } catch (error: any) {
    console.error("GetAllEmployeeWorkingStatusMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getEmployeeWorkingStatusMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ success: false, message: "Working Status ID is required" });
    return;
  }
  try {
    const status = await getEmployeeWorkingStatusMasterByIdService(parseInt(id as string, 10));
    if (!status) {
      res.status(404).json({ success: false, message: "Working status not found" });
      return;
    }
    res.json({ success: true, data: status });
  } catch (error: any) {
    console.error("GetEmployeeWorkingStatusMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveEmployeeWorkingStatusMaster = async (req: Request, res: Response): Promise<void> => {
  const statusData: EmployeeWorkingStatusMasterData = req.body;
  if (!statusData.EMP_CURRENT_STATUS_NAME) {
    res.status(400).json({ success: false, message: "Working Status Name is required" });
    return;
  }
  try {
    const result = await saveEmployeeWorkingStatusMasterService(statusData);
    res.json({ success: true, message: result.message || "Working status saved successfully" });
  } catch (error: any) {
    console.error("SaveEmployeeWorkingStatusMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateEmployeeWorkingStatusMaster = async (req: Request, res: Response): Promise<void> => {
  const statusData: EmployeeWorkingStatusMasterData = req.body;
  const { id } = req.params;
  try {
    if (!statusData.EMP_CURRENT_STATUS_ID && id) {
      statusData.EMP_CURRENT_STATUS_ID = parseInt(id as string, 10);
    }
    const result = await updateEmployeeWorkingStatusMasterService(statusData);
    res.json({ success: true, message: result.message || "Working status updated successfully" });
  } catch (error: any) {
    console.error("UpdateEmployeeWorkingStatusMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteEmployeeWorkingStatusMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);
  if (!id) {
    res.status(400).json({ success: false, message: "Working Status ID is required" });
    return;
  }
  try {
    const result = await deleteEmployeeWorkingStatusMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Working status deleted successfully" });
  } catch (error: any) {
    console.error("DeleteEmployeeWorkingStatusMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
