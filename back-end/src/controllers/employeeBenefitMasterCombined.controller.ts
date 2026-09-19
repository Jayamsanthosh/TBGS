import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllEmployeeBenefitMasterCombinedService,
  getEmployeeBenefitMasterHdrService,
  getEmployeeBenefitMasterDtlService,
  saveEmployeeBenefitMasterCombinedService,
  updateEmployeeBenefitMasterCombinedService,
  deleteEmployeeBenefitMasterDtlService,
  deleteEmployeeBenefitMasterHdrService,
  EmployeeBenefitMasterData
} from "../services/employeeBenefitMasterCombined.services";

export const getAllEmployeeBenefitMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await getAllEmployeeBenefitMasterCombinedService();
    res.json({ success: true, count: data.length, data });
  } catch (error: any) {
    console.error("GetAllEmployeeBenefitMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getEmployeeBenefitMasterHdr = async (req: Request, res: Response): Promise<void> => {
  const { refNo } = req.params;

  if (!refNo) {
    res.status(400).json({ success: false, message: "Employee benefit reference no is required" });
    return;
  }

  try {
    const data = await getEmployeeBenefitMasterHdrService(refNo as string);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("GetEmployeeBenefitMasterHdr error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getEmployeeBenefitMasterDtl = async (req: Request, res: Response): Promise<void> => {
  const { sno } = req.params;

  if (!sno) {
    res.status(400).json({ success: false, message: "Detail SNO is required" });
    return;
  }

  try {
    const data = await getEmployeeBenefitMasterDtlService(parseInt(sno as string, 10));
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("GetEmployeeBenefitMasterDtl error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveEmployeeBenefitMaster = async (req: Request, res: Response): Promise<void> => {
  const data: EmployeeBenefitMasterData = req.body;

  if (!data.EMP_ID || !data.COMPANY_ID || !data.BENEFIT_DATE || !data.TOTAL_GROSS_AMOUNT) {
    res.status(400).json({ success: false, message: "Employee, Company, Benefit Date and Total Gross Amount are required" });
    return;
  }

  const dtls = Array.isArray(data.dtls) ? data.dtls : [];
  if (!dtls.length || !dtls.some((d) => d.BENEFIT_TYPE_ID)) {
    res.status(400).json({ success: false, message: "At least one Benefit Type is required" });
    return;
  }

  try {
    const result = await saveEmployeeBenefitMasterCombinedService(data);
    res.json({
      success: true,
      message: result.message || "Employee benefit saved successfully",
      EMP_BENEFIT_REF_NO: result.EMP_BENEFIT_REF_NO,
    });
  } catch (error: any) {
    console.error("SaveEmployeeBenefitMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateEmployeeBenefitMaster = async (req: Request, res: Response): Promise<void> => {
  const data: EmployeeBenefitMasterData = req.body;
  const { refNo } = req.params;

  try {
    if (!data.EMP_BENEFIT_REF_NO && refNo) {
      data.EMP_BENEFIT_REF_NO = refNo as string;
    }

    const result = await updateEmployeeBenefitMasterCombinedService(data);
    res.json({ success: true, message: result.message || "Employee benefit updated successfully" });
  } catch (error: any) {
    console.error("UpdateEmployeeBenefitMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteEmployeeBenefitMasterDtl = async (req: Request, res: Response): Promise<void> => {
  const { sno } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!sno) {
    res.status(400).json({ success: false, message: "Detail SNO is required" });
    return;
  }

  try {
    const result = await deleteEmployeeBenefitMasterDtlService(
      parseInt(sno as string, 10),
      USER || "Admin",
      ROLE || "Admin",
      MAC_ADDRESS || "WEB"
    );
    res.json({ success: true, message: result.message || "Employee benefit detail deleted successfully" });
  } catch (error: any) {
    console.error("DeleteEmployeeBenefitMasterDtl error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteEmployeeBenefitMasterHdr = async (req: Request, res: Response): Promise<void> => {
  const { refNo } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!refNo) {
    res.status(400).json({ success: false, message: "Employee benefit reference no is required" });
    return;
  }

  try {
    const result = await deleteEmployeeBenefitMasterHdrService(
      refNo as string,
      USER || "Admin",
      ROLE || "Admin",
      MAC_ADDRESS || "WEB"
    );
    res.json({ success: true, message: result.message || "Employee benefit header deleted successfully" });
  } catch (error: any) {
    console.error("DeleteEmployeeBenefitMasterHdr error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
