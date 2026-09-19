import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllEmployeeDatabaseService,
  getEmployeeDatabaseByIdService,
  saveEmployeeDatabaseService,
  updateEmployeeDatabaseService,
  deleteEmployeeDatabaseService,
  EmployeeDatabaseData
} from "../services/employeeDatabase.services";

const VALID_STATUSES = ["AC", "IN"];

const parseId = (raw: unknown): number | null => {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const authFrom = identityFrom;

const validateEmployee = (data: EmployeeDatabaseData): string | null => {
  if (!data.EMP_ID || Number.isNaN(Number(data.EMP_ID))) {
    return "Employee ID is required";
  }
  if (!data.FIRST_NAME || !String(data.FIRST_NAME).trim()) {
    return "First Name is required";
  }
  if (!data.LAST_NAME || !String(data.LAST_NAME).trim()) {
    return "Last Name is required";
  }
  if (!data.COMPANY_ID || Number.isNaN(Number(data.COMPANY_ID))) {
    return "Company is required";
  }
  if (!data.DEPARTMENT_ID || Number.isNaN(Number(data.DEPARTMENT_ID))) {
    return "Department is required";
  }
  if (!data.DESIGNATION_ID || Number.isNaN(Number(data.DESIGNATION_ID))) {
    return "Designation is required";
  }
  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    return "Status must be AC or IN";
  }
  return null;
};

export const getAllEmployeeDatabase = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const items = await getAllEmployeeDatabaseService(status || undefined);
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllEmployeeDatabase error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getEmployeeDatabaseById = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, message: "A valid SNO is required" });
    return;
  }
  try {
    const item = await getEmployeeDatabaseByIdService(id);
    if (!item) {
      res.status(404).json({ success: false, message: "Employee not found" });
      return;
    }
    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetEmployeeDatabaseById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveEmployeeDatabase = async (req: Request, res: Response): Promise<void> => {
  const employeeData: EmployeeDatabaseData = req.body;
  const validationError = validateEmployee(employeeData);
  if (validationError) {
    res.status(400).json({ success: false, message: validationError });
    return;
  }
  try {
    const result = await saveEmployeeDatabaseService(employeeData);
    res.json({
      success: true,
      message: result.message || "Employee saved successfully",
      SNO: result.SNO
    });
  } catch (error: any) {
    console.error("SaveEmployeeDatabase error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateEmployeeDatabase = async (req: Request, res: Response): Promise<void> => {
  const employeeData: EmployeeDatabaseData = req.body;
  const id = parseId(req.params.id) ?? parseId(String(employeeData.SNO ?? ""));
  if (!id) {
    res.status(400).json({ success: false, message: "A valid SNO is required" });
    return;
  }
  const validationError = validateEmployee(employeeData);
  if (validationError) {
    res.status(400).json({ success: false, message: validationError });
    return;
  }
  try {
    employeeData.SNO = id;
    const result = await updateEmployeeDatabaseService(employeeData);
    res.json({ success: true, message: result.message || "Employee updated successfully" });
  } catch (error: any) {
    console.error("UpdateEmployeeDatabase error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteEmployeeDatabase = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, message: "A valid Employee ID is required" });
    return;
  }
  const { USER, ROLE, MAC_ADDRESS } = authFrom(req);
  if ((ROLE || "").toLowerCase() !== "admin") {
    res.status(403).json({ success: false, message: "NO RIGHTS TO DELETE" });
    return;
  }
  try {
    const result = await deleteEmployeeDatabaseService(id, USER, ROLE, MAC_ADDRESS);
    res.json({ success: true, message: result.message || "Employee deleted successfully" });
  } catch (error: any) {
    console.error("DeleteEmployeeDatabase error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
