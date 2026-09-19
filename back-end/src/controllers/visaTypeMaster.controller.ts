import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllVisaTypeMasterService,
  getVisaTypeMasterByIdService,
  saveVisaTypeMasterService,
  updateVisaTypeMasterService,
  deleteVisaTypeMasterService,
  VisaTypeMasterData
} from "../services/visaTypeMaster.services";

export const getAllVisaTypeMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const visaTypes = await getAllVisaTypeMasterService(status || undefined);
    res.json({ success: true, count: visaTypes.length, data: visaTypes });
  } catch (error: any) {
    console.error("GetAllVisaTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getVisaTypeMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ success: false, message: "Visa Type ID is required" });
    return;
  }
  try {
    const visaType = await getVisaTypeMasterByIdService(parseInt(id as string, 10));
    if (!visaType) {
      res.status(404).json({ success: false, message: "Visa type not found" });
      return;
    }
    res.json({ success: true, data: visaType });
  } catch (error: any) {
    console.error("GetVisaTypeMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveVisaTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const visaTypeData: VisaTypeMasterData = req.body;
  if (!visaTypeData.VISA_TYPE_NAME) {
    res.status(400).json({ success: false, message: "Visa Type Name is required" });
    return;
  }
  try {
    const result = await saveVisaTypeMasterService(visaTypeData);
    res.json({ success: true, message: result.message || "Visa type saved successfully" });
  } catch (error: any) {
    console.error("SaveVisaTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateVisaTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const visaTypeData: VisaTypeMasterData = req.body;
  const { id } = req.params;
  try {
    if (!visaTypeData.VISA_TYPE_ID && id) {
      visaTypeData.VISA_TYPE_ID = parseInt(id as string, 10);
    }
    const result = await updateVisaTypeMasterService(visaTypeData);
    res.json({ success: true, message: result.message || "Visa type updated successfully" });
  } catch (error: any) {
    console.error("UpdateVisaTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteVisaTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);
  if (!id) {
    res.status(400).json({ success: false, message: "Visa Type ID is required" });
    return;
  }
  try {
    const result = await deleteVisaTypeMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Visa type deleted successfully" });
  } catch (error: any) {
    console.error("DeleteVisaTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
