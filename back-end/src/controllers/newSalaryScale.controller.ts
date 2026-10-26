import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllNewSalaryScaleService,
  getNewSalaryScaleByIdService,
  saveNewSalaryScaleService,
  updateNewSalaryScaleService,
  deleteNewSalaryScaleService,
  type NewSalaryScaleData,
} from "../services/newSalaryScale.services";

const parseId = (raw: unknown): number | null => {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const VALID_STATUSES = ["AC", "IA"];

export const getAllNewSalaryScale = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
    const items = await getAllNewSalaryScaleService(status);
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllNewSalaryScale error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getNewSalaryScaleById = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);

  if (!id) {
    res.status(400).json({ success: false, message: "A valid SALARY_SCALE_ID is required" });
    return;
  }

  try {
    const rawLinkId = req.query.LINK_ID ?? req.query.link_id;
    const linkId = rawLinkId != null && rawLinkId !== "" ? Number(rawLinkId) : null;
    const item = await getNewSalaryScaleByIdService(id, Number.isFinite(linkId) ? linkId : null);

    if (!item) {
      res.status(404).json({ success: false, message: "Salary scale not found" });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetNewSalaryScaleById error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveNewSalaryScale = async (req: Request, res: Response): Promise<void> => {
  const data: NewSalaryScaleData = req.body;

  if (!data.SALARY_SCALE_NAME?.trim()) {
    res.status(400).json({ success: false, message: "Salary scale name is required" });
    return;
  }

  if (!data.DESIGNATION_GROUP_ID) {
    res.status(400).json({ success: false, message: "Designation group is required" });
    return;
  }

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  const { USER, MAC_ADDRESS } = identityFrom(req);
  data.USER = USER || data.USER || "Admin";
  data.MAC_ADDRESS = MAC_ADDRESS || data.MAC_ADDRESS || "WEB";
  if (data.LINK_ID === undefined || data.LINK_ID === null) {
    data.LINK_ID = 92;
  }

  try {
    const result = await saveNewSalaryScaleService(data);
    res.json({
      success: true,
      message: result.message || "DATA SAVED SUCCESSFULLY",
      data: result.SALARY_SCALE_ID,
      SALARY_SCALE_ID: result.SALARY_SCALE_ID,
    });
  } catch (error: any) {
    console.error("SaveNewSalaryScale error:", error);
    res.status(error?.httpStatus || 400).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateNewSalaryScale = async (req: Request, res: Response): Promise<void> => {
  const data: NewSalaryScaleData = req.body;
  const id = parseId(req.params.id) ?? parseId(data.SALARY_SCALE_ID);

  if (!id) {
    res.status(400).json({ success: false, message: "A valid SALARY_SCALE_ID is required" });
    return;
  }

  if (!data.SALARY_SCALE_NAME?.trim()) {
    res.status(400).json({ success: false, message: "Salary scale name is required" });
    return;
  }

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  data.SALARY_SCALE_ID = id;
  const { USER, MAC_ADDRESS } = identityFrom(req);
  data.USER = USER || data.USER || "Admin";
  data.MAC_ADDRESS = MAC_ADDRESS || data.MAC_ADDRESS || "WEB";
  if (data.LINK_ID === undefined || data.LINK_ID === null) {
    data.LINK_ID = 92;
  }

  try {
    const result = await updateNewSalaryScaleService(data);
    res.json({
      success: true,
      message: result.message || "RECORD UPDATED SUCCESSFULLY",
      data: result.SALARY_SCALE_ID,
      SALARY_SCALE_ID: result.SALARY_SCALE_ID,
    });
  } catch (error: any) {
    console.error("UpdateNewSalaryScale error:", error);
    res.status(error?.httpStatus || 400).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteNewSalaryScale = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "A valid SALARY_SCALE_ID is required" });
    return;
  }

  try {
    const result = await deleteNewSalaryScaleService(
      id,
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "RECORD DELETED SUCCESSFULLY" });
  } catch (error: any) {
    console.error("DeleteNewSalaryScale error:", error);
    res.status(error?.httpStatus || 400).json({ success: false, message: error?.message || "Internal server error" });
  }
};
