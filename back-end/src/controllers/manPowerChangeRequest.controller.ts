import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllManPowerChangeRequestService,
  getManPowerChangeRequestByIdService,
  saveManPowerChangeRequestService,
  updateManPowerChangeRequestService,
  deleteManPowerChangeRequestService,
  type ManPowerChangeRequestData,
} from "../services/manPowerChangeRequest.services";

const VALID_STATUSES = ["AC", "IA"];

export const getAllManPowerChangeRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = parseInt(req.query.companyId as string, 10) || 0;
    const status = req.query.status as string | undefined;
    const items = await getAllManPowerChangeRequestService(companyId, status || undefined);
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllManPowerChangeRequest error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getManPowerChangeRequestById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Man power request ID is required" });
    return;
  }

  try {
    const item = await getManPowerChangeRequestByIdService(parseInt(id as string, 10));

    if (!item) {
      res.status(404).json({ success: false, message: "Man power change request not found" });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetManPowerChangeRequestById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveManPowerChangeRequest = async (req: Request, res: Response): Promise<void> => {
  const data: ManPowerChangeRequestData = req.body;

  if (!data.COMPANY_ID) {
    res.status(400).json({ success: false, message: "Company is required" });
    return;
  }
  if (!data.DEPARTMENT_ID) {
    res.status(400).json({ success: false, message: "Department is required" });
    return;
  }
  if (!data.DESIGNATION_ID) {
    res.status(400).json({ success: false, message: "Designation is required" });
    return;
  }
  if (!data.EMPLOYMENT_TYPE_ID) {
    res.status(400).json({ success: false, message: "Employment type is required" });
    return;
  }
  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    const result = await saveManPowerChangeRequestService(data);
    res.json({ success: true, message: result.message || "Data saved successfully", MAN_POWER_REQUEST_ID: result.MAN_POWER_REQUEST_ID });
  } catch (error: any) {
    console.error("SaveManPowerChangeRequest error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateManPowerChangeRequest = async (req: Request, res: Response): Promise<void> => {
  const data: ManPowerChangeRequestData = req.body;
  const { id } = req.params;

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    if (!data.MAN_POWER_REQUEST_ID && id) {
      data.MAN_POWER_REQUEST_ID = parseInt(id as string, 10);
    }

    const result = await updateManPowerChangeRequestService(data);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateManPowerChangeRequest error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteManPowerChangeRequest = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Man power request ID is required" });
    return;
  }

  try {
    const result = await deleteManPowerChangeRequestService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteManPowerChangeRequest error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
