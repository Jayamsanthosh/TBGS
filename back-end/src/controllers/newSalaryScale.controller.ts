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

export const getAllNewSalaryScale = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const items = await getAllNewSalaryScaleService(status || undefined);
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllNewSalaryScale error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getNewSalaryScaleById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "SALARY_SCALE_ID is required" });
    return;
  }

  try {
    const item = await getNewSalaryScaleByIdService(parseInt(id as string, 10));

    if (!item) {
      res.status(404).json({ success: false, message: "Salary scale not found" });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetNewSalaryScaleById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

const VALID_STATUSES = ["AC", "IA"];

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

  try {
    const result = await saveNewSalaryScaleService(data);
    res.json({ success: true, message: result.message || "Data saved successfully", SALARY_SCALE_ID: result.SALARY_SCALE_ID });
  } catch (error: any) {
    console.error("SaveNewSalaryScale error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateNewSalaryScale = async (req: Request, res: Response): Promise<void> => {
  const data: NewSalaryScaleData = req.body;
  const { id } = req.params;

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    if (!data.SALARY_SCALE_ID && id) {
      data.SALARY_SCALE_ID = parseInt(id as string, 10);
    }

    const result = await updateNewSalaryScaleService(data);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateNewSalaryScale error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteNewSalaryScale = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "SALARY_SCALE_ID is required" });
    return;
  }

  try {
    const result = await deleteNewSalaryScaleService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteNewSalaryScale error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
