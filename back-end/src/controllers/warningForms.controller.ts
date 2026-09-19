import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllWarningFormsService,
  getWarningFormByIdService,
  saveWarningFormService,
  updateWarningFormService,
  deleteWarningFormService,
  type WarningFormData,
} from "../services/warningForms.services";
import { getAllowedCompanyIds } from "../services/auth.services";

export const getAllWarningForms = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
    const isAdmin = req.user?.role === "Admin" || req.user?.role === "Super Admin";
    let allowedCompanyIds: number[] | undefined;
    if (!isAdmin) {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }
      allowedCompanyIds = await getAllowedCompanyIds(req.user.sub);
      if (allowedCompanyIds.length === 0) {
        res.json({ success: true, count: 0, data: [] });
        return;
      }
    }
    const items = await getAllWarningFormsService(status, allowedCompanyIds);
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllWarningForms error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getWarningFormById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Warning request ref no is required" });
    return;
  }

  try {
    const item = await getWarningFormByIdService(String(id));

    if (!item) {
      res.status(404).json({ success: false, message: "Warning form not found" });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetWarningFormById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveWarningForms = async (req: Request, res: Response): Promise<void> => {
  const data: WarningFormData = req.body;

  if (!data.EMP_ID) {
    res.status(400).json({ success: false, message: "Employee is required" });
    return;
  }
  if (!data.COMPANY_ID) {
    res.status(400).json({ success: false, message: "Company is required" });
    return;
  }

  try {
    const result = await saveWarningFormService(data);
    res.json({ success: true, message: result.message || "Data saved successfully", SNO: result.SNO });
  } catch (error: any) {
    console.error("SaveWarningForms error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateWarningForms = async (req: Request, res: Response): Promise<void> => {
  const data: WarningFormData = req.body;
  const { id } = req.params;

  try {
    if (!data.SNO && id) {
      data.SNO = parseInt(String(id), 10);
    }

    const result = await updateWarningFormService(data);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateWarningForms error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteWarningForms = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Warning request ref no is required" });
    return;
  }

  try {
    const result = await deleteWarningFormService(
      String(id),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteWarningForms error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};