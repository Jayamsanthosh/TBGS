import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllCompanyQuotaAnimalMappingCombinedService,
  getCompanyQuotaAnimalMappingHdrService,
  getCompanyQuotaAnimalMappingDtlService,
  saveCompanyQuotaAnimalMappingCombinedService,
  updateCompanyQuotaAnimalMappingCombinedService,
  deleteCompanyQuotaAnimalMappingDtlService,
  deleteCompanyQuotaAnimalMappingHdrService,
  CompanyQuotaAnimalMappingData
} from "../services/companyQuotaAnimalMappingCombined.services";

export const getAllCompanyQuotaAnimalMapping = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await getAllCompanyQuotaAnimalMappingCombinedService();
    res.json({ success: true, count: data.length, data });
  } catch (error: any) {
    console.error("GetAllCompanyQuotaAnimalMapping error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getCompanyQuotaAnimalMappingHdr = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Quota ID is required" });
    return;
  }

  try {
    const data = await getCompanyQuotaAnimalMappingHdrService(parseInt(id as string, 10));
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("GetCompanyQuotaAnimalMappingHdr error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getCompanyQuotaAnimalMappingDtl = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Detail SNO is required" });
    return;
  }

  try {
    const data = await getCompanyQuotaAnimalMappingDtlService(parseInt(id as string, 10));
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("GetCompanyQuotaAnimalMappingDtl error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveCompanyQuotaAnimalMapping = async (req: Request, res: Response): Promise<void> => {
  const data: CompanyQuotaAnimalMappingData = req.body;

  if (!data.COMPANY_ID || !data.CAMP_ID || !data.EFFECTIVE_YEAR) {
    res.status(400).json({ success: false, message: "Company, Camp and Effective Year are required" });
    return;
  }

  const dtls = Array.isArray(data.dtls) ? data.dtls : [];
  if (!dtls.length || !dtls.some((d) => d.ANIMAL_ID)) {
    res.status(400).json({ success: false, message: "At least one Animal is required" });
    return;
  }

  try {
    const result = await saveCompanyQuotaAnimalMappingCombinedService(data);
    res.json({ success: true, message: result.message || "Company quota animal mapping saved successfully", QUOTA_ID: result.QUOTA_ID });
  } catch (error: any) {
    console.error("SaveCompanyQuotaAnimalMapping error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateCompanyQuotaAnimalMapping = async (req: Request, res: Response): Promise<void> => {
  const data: CompanyQuotaAnimalMappingData = req.body;
  const { id } = req.params;

  try {
    if (id) {
      data.QUOTA_ID = parseInt(id as string, 10);
    }

    const result = await updateCompanyQuotaAnimalMappingCombinedService(data);
    res.json({ success: true, message: result.message || "Company quota animal mapping updated successfully" });
  } catch (error: any) {
    console.error("UpdateCompanyQuotaAnimalMapping error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteCompanyQuotaAnimalMappingDtl = async (req: Request, res: Response): Promise<void> => {
  const { sno } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!sno) {
    res.status(400).json({ success: false, message: "Detail SNO is required" });
    return;
  }

  try {
    const result = await deleteCompanyQuotaAnimalMappingDtlService(
      parseInt(sno as string, 10),
      USER || "Admin",
      ROLE || "Admin",
      MAC_ADDRESS || "WEB"
    );
    res.json({ success: true, message: result.message || "Quota animal detail deleted successfully" });
  } catch (error: any) {
    console.error("DeleteCompanyQuotaAnimalMappingDtl error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteCompanyQuotaAnimalMappingHdr = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Quota ID is required" });
    return;
  }

  try {
    const result = await deleteCompanyQuotaAnimalMappingHdrService(
      parseInt(id as string, 10),
      USER || "Admin",
      ROLE || "Admin",
      MAC_ADDRESS || "WEB"
    );
    res.json({ success: true, message: result.message || "Quota header deleted successfully" });
  } catch (error: any) {
    console.error("DeleteCompanyQuotaAnimalMappingHdr error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
