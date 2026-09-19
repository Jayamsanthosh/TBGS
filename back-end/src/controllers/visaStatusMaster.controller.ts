import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  getAllVisaStatusMasterService,
  getVisaStatusMasterByIdService,
  saveVisaStatusMasterService,
  updateVisaStatusMasterService,
  deleteVisaStatusMasterService,
  VisaStatusMasterData
} from "../services/visaStatusMaster.services";

export const getAllVisaStatusMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
    const visaStatuses = await getAllVisaStatusMasterService(status);
    res.json({ success: true, count: visaStatuses.length, data: visaStatuses });
  } catch (error: any) {
    console.error("GetAllVisaStatusMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getVisaStatusMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Visa Status ID is required" });
    return;
  }

  try {
    const visaStatus = await getVisaStatusMasterByIdService(parseInt(id as string, 10));

    if (!visaStatus) {
      res.status(404).json({ success: false, message: "Visa Status not found" });
      return;
    }

    res.json({ success: true, data: visaStatus });
  } catch (error: any) {
    console.error("GetVisaStatusMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveVisaStatusMaster = async (req: Request, res: Response): Promise<void> => {
  const visaStatusData: VisaStatusMasterData = req.body;

  if (!visaStatusData.VISA_STATUS_NAME) {
    res.status(400).json({ success: false, message: "Visa Status Name is required" });
    return;
  }

  try {
    const result = await saveVisaStatusMasterService(visaStatusData);
    res.json({ success: true, message: result.message || "Data saved successfully", VISA_STATUS_ID: result.VISA_STATUS_ID });
  } catch (error: any) {
    console.error("SaveVisaStatusMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateVisaStatusMaster = async (req: Request, res: Response): Promise<void> => {
  const visaStatusData: VisaStatusMasterData = req.body;
  const { id } = req.params;

  try {
    if (!visaStatusData.VISA_STATUS_ID && id) {
      visaStatusData.VISA_STATUS_ID = parseInt(id as string, 10);
    }

    const result = await updateVisaStatusMasterService(visaStatusData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateVisaStatusMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteVisaStatusMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Visa Status ID is required" });
    return;
  }

  try {
    const result = await deleteVisaStatusMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteVisaStatusMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};