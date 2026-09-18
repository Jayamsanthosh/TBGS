import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllEmployeeContractTypeMasterService,
  getEmployeeContractTypeMasterByIdService,
  saveEmployeeContractTypeMasterService,
  updateEmployeeContractTypeMasterService,
  deleteEmployeeContractTypeMasterService,
  EmployeeContractTypeMasterData
} from "../services/employeeContractTypeMaster.services";

export const getAllEmployeeContractTypeMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const contractTypes = await getAllEmployeeContractTypeMasterService(status || undefined);
    res.json({ success: true, count: contractTypes.length, data: contractTypes });
  } catch (error: any) {
    console.error("GetAllEmployeeContractTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getEmployeeContractTypeMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ success: false, message: "Contract Type ID is required" });
    return;
  }
  try {
    const contractType = await getEmployeeContractTypeMasterByIdService(parseInt(id as string, 10));
    if (!contractType) {
      res.status(404).json({ success: false, message: "Contract type not found" });
      return;
    }
    res.json({ success: true, data: contractType });
  } catch (error: any) {
    console.error("GetEmployeeContractTypeMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveEmployeeContractTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const contractTypeData: EmployeeContractTypeMasterData = req.body;
  if (!contractTypeData.CONTRACT_TYPE_NAME) {
    res.status(400).json({ success: false, message: "Contract Type Name is required" });
    return;
  }
  try {
    const result = await saveEmployeeContractTypeMasterService(contractTypeData);
    res.json({ success: true, message: result.message || "Contract type saved successfully" });
  } catch (error: any) {
    console.error("SaveEmployeeContractTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateEmployeeContractTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const contractTypeData: EmployeeContractTypeMasterData = req.body;
  const { id } = req.params;
  try {
    if (!contractTypeData.CONTRACT_TYPE_ID && id) {
      contractTypeData.CONTRACT_TYPE_ID = parseInt(id as string, 10);
    }
    const result = await updateEmployeeContractTypeMasterService(contractTypeData);
    res.json({ success: true, message: result.message || "Contract type updated successfully" });
  } catch (error: any) {
    console.error("UpdateEmployeeContractTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteEmployeeContractTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);
  if (!id) {
    res.status(400).json({ success: false, message: "Contract Type ID is required" });
    return;
  }
  try {
    const result = await deleteEmployeeContractTypeMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Contract type deleted successfully" });
  } catch (error: any) {
    console.error("DeleteEmployeeContractTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
