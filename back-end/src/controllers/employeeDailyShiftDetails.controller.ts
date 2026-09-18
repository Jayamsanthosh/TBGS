import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllEmployeeDailyShiftDetailsService,
  getEmployeeDailyShiftDetailsByIdService,
  saveEmployeeDailyShiftDetailsService,
  updateEmployeeDailyShiftDetailsService,
  deleteEmployeeDailyShiftDetailsService,
  EmployeeDailyShiftDetailsData,
} from "../services/employeeDailyShiftDetails.services";

export const getAllEmployeeDailyShiftDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const empId = req.query.empId as string | undefined;
    const status = req.query.status as string | undefined;
    const records = await getAllEmployeeDailyShiftDetailsService(empId, status);
    res.json({ success: true, count: records.length, data: records });
  } catch (error: any) {
    console.error("GetAllEmployeeDailyShiftDetails error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getEmployeeDailyShiftDetailsById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "SNO is required" });
    return;
  }

  try {
    const record = await getEmployeeDailyShiftDetailsByIdService(parseInt(id as string, 10));

    if (!record) {
      res.status(404).json({ success: false, message: "Daily shift detail not found" });
      return;
    }

    res.json({ success: true, data: record });
  } catch (error: any) {
    console.error("GetEmployeeDailyShiftDetailsById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

const VALID_STATUSES = ["AC", "IA"];

export const saveEmployeeDailyShiftDetails = async (req: Request, res: Response): Promise<void> => {
  const data: EmployeeDailyShiftDetailsData = req.body;

  if (!data.EMP_ID) {
    res.status(400).json({ success: false, message: "Employee is required" });
    return;
  }

  if (!data.SHIFT_DATE) {
    res.status(400).json({ success: false, message: "Shift date is required" });
    return;
  }

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    const result = await saveEmployeeDailyShiftDetailsService(data);
    res.json({
      success: true,
      message: result.message || "Data saved successfully",
      SNO: result.SNO,
    });
  } catch (error: any) {
    console.error("SaveEmployeeDailyShiftDetails error:", error);
    res.status(400).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateEmployeeDailyShiftDetails = async (req: Request, res: Response): Promise<void> => {
  const data: EmployeeDailyShiftDetailsData = req.body;
  const { id } = req.params;

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    if (!data.SNO && id) {
      data.SNO = parseInt(id as string, 10);
    }

    const result = await updateEmployeeDailyShiftDetailsService(data);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateEmployeeDailyShiftDetails error:", error);
    res.status(400).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteEmployeeDailyShiftDetails = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "SNO is required" });
    return;
  }

  try {
    const result = await deleteEmployeeDailyShiftDetailsService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteEmployeeDailyShiftDetails error:", error);
    res.status(400).json({ success: false, message: error?.message || "Internal server error" });
  }
};
