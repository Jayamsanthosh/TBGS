import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllCompanyMasterService,
  getCompanyMasterByIdService,
  saveCompanyMasterService,
  updateCompanyMasterService,
  deleteCompanyMasterService,
  CompanyMasterData
} from "../services/companyMaster.services";

export const getAllCompanyMaster = async (_req: Request, res: Response): Promise<void> => {
  try {
    const companies = await getAllCompanyMasterService();
    res.json({ success: true, count: companies.length, data: companies });
  } catch (error: any) {
    console.error("GetAllCompanyMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getCompanyMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Company ID is required" });
    return;
  }

  try {
    const company = await getCompanyMasterByIdService(parseInt(id as string, 10));

    if (!company) {
      res.status(404).json({ success: false, message: "Company not found" });
      return;
    }

    res.json({ success: true, data: company });
  } catch (error: any) {
    console.error("GetCompanyMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveCompanyMaster = async (req: Request, res: Response): Promise<void> => {
  const companyData: CompanyMasterData = req.body;

  if (!companyData.COMPANY_NAME) {
    res.status(400).json({ success: false, message: "Company Name is required" });
    return;
  }

  try {
    const result = await saveCompanyMasterService(companyData);
    res.json({ success: true, message: result.message || "Company saved successfully" });
  } catch (error: any) {
    console.error("SaveCompanyMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateCompanyMaster = async (req: Request, res: Response): Promise<void> => {
  const companyData: CompanyMasterData = req.body;
  const { id } = req.params;

  try {
    if (!companyData.COMPANY_ID && id) {
      companyData.COMPANY_ID = parseInt(id as string, 10);
    }

    const result = await updateCompanyMasterService(companyData);
    res.json({ success: true, message: result.message || "Company updated successfully" });
  } catch (error: any) {
    console.error("UpdateCompanyMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteCompanyMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Company ID is required" });
    return;
  }

  try {
    const result = await deleteCompanyMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Company deleted successfully" });
  } catch (error: any) {
    console.error("DeleteCompanyMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
