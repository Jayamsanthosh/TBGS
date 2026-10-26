import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllPayrollDeductionTypeMasterService,
  getPayrollDeductionTypeMasterByIdService,
  savePayrollDeductionTypeMasterService,
  updatePayrollDeductionTypeMasterService,
  deletePayrollDeductionTypeMasterService,
  PayrollDeductionTypeMasterData,
} from "../services/payrollDeductionTypeMaster.services";

const parseId = (raw: unknown): number | null => {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const VALID_STATUSES = ["AC", "IA", "ACTIVE", "INACTIVE"];

export const getAllPayrollDeductionTypeMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
    const deductionTypes = await getAllPayrollDeductionTypeMasterService(status);
    res.json({ success: true, count: deductionTypes.length, data: deductionTypes });
  } catch (error: any) {
    console.error("GetAllPayrollDeductionTypeMaster error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPayrollDeductionTypeMasterById = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);

  if (!id) {
    res.status(400).json({ success: false, message: "A valid Deduction Type ID is required" });
    return;
  }

  try {
    const rawLinkId = req.query.LINK_ID ?? req.query.link_id;
    const linkId = rawLinkId != null && rawLinkId !== "" ? Number(rawLinkId) : null;
    const deductionType = await getPayrollDeductionTypeMasterByIdService(id, Number.isFinite(linkId) ? linkId : null);

    if (!deductionType) {
      res.status(404).json({ success: false, message: "Deduction type not found" });
      return;
    }

    res.json({ success: true, data: deductionType });
  } catch (error: any) {
    console.error("GetPayrollDeductionTypeMasterById error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const savePayrollDeductionTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const data: PayrollDeductionTypeMasterData = req.body;

  if (!data.SALARY_DEDUCTION_TYPE?.trim()) {
    res.status(400).json({ success: false, message: "Salary/Deduction type is required" });
    return;
  }

  if (!data.DEDUCTION_TYPE_NAME?.trim()) {
    res.status(400).json({ success: false, message: "Deduction type name is required" });
    return;
  }

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER.toUpperCase())) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  const { USER, MAC_ADDRESS } = identityFrom(req);
  data.USER = USER || data.USER || "Admin";
  data.MAC_ADDRESS = MAC_ADDRESS || data.MAC_ADDRESS || "WEB";
  if (data.LINK_ID === undefined || data.LINK_ID === null) {
    data.LINK_ID = 221;
  }

  try {
    const result = await savePayrollDeductionTypeMasterService(data);
    res.json({
      success: true,
      message: result.message || "Data Saved Successfully",
      data: result.DEDUCTION_TYPE_ID,
      DEDUCTION_TYPE_ID: result.DEDUCTION_TYPE_ID,
    });
  } catch (error: any) {
    console.error("SavePayrollDeductionTypeMaster error:", error);
    res.status(error?.httpStatus || 400).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updatePayrollDeductionTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const data: PayrollDeductionTypeMasterData = req.body;
  const id = parseId(req.params.id) ?? parseId(data.DEDUCTION_TYPE_ID);

  if (!id) {
    res.status(400).json({ success: false, message: "A valid Deduction Type ID is required" });
    return;
  }

  if (!data.SALARY_DEDUCTION_TYPE?.trim()) {
    res.status(400).json({ success: false, message: "Salary/Deduction type is required" });
    return;
  }

  if (!data.DEDUCTION_TYPE_NAME?.trim()) {
    res.status(400).json({ success: false, message: "Deduction type name is required" });
    return;
  }

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER.toUpperCase())) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  data.DEDUCTION_TYPE_ID = id;
  const { USER, MAC_ADDRESS } = identityFrom(req);
  data.USER = USER || data.USER || "Admin";
  data.MAC_ADDRESS = MAC_ADDRESS || data.MAC_ADDRESS || "WEB";
  if (data.LINK_ID === undefined || data.LINK_ID === null) {
    data.LINK_ID = 221;
  }

  try {
    const result = await updatePayrollDeductionTypeMasterService(data);
    res.json({
      success: true,
      message: result.message || "Data Updated Successfully",
      data: result.DEDUCTION_TYPE_ID,
      DEDUCTION_TYPE_ID: result.DEDUCTION_TYPE_ID,
    });
  } catch (error: any) {
    console.error("UpdatePayrollDeductionTypeMaster error:", error);
    res.status(error?.httpStatus || 400).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deletePayrollDeductionTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "A valid Deduction Type ID is required" });
    return;
  }

  try {
    const result = await deletePayrollDeductionTypeMasterService(
      id,
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeletePayrollDeductionTypeMaster error:", error);
    res.status(error?.httpStatus || 400).json({ success: false, message: error?.message || "Internal server error" });
  }
};