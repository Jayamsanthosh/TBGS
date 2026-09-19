import { Request, Response } from "express";
import {
  getAllFieldCombinedService,
  saveFieldCombinedService,
  updateFieldCombinedService,
  deleteFieldCombinedService,
  FieldCombinedData
} from "../services/fieldCombined.services";

export const getAllFieldCombined = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await getAllFieldCombinedService();
    res.json({ success: true, count: data.length, data });
  } catch (error: any) {
    console.error("GetAllFieldCombined error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveFieldCombined = async (req: Request, res: Response): Promise<void> => {
  const fieldData: FieldCombinedData = req.body;

  if (!fieldData.PROJECT_NAME_FLD_HDR) {
    res.status(400).json({ success: false, message: "Project Name is required" });
    return;
  }

  const dtls = Array.isArray(fieldData.dtls) ? fieldData.dtls : [];
  if (!dtls.length || !dtls.some((d) => d.ACTIVITY_NAME_FLD_DTL)) {
    res.status(400).json({ success: false, message: "At least one Activity Name is required" });
    return;
  }

  try {
    const result = await saveFieldCombinedService(fieldData);
    res.json({ success: true, message: result.message || "Field saved successfully", FIELD_ID_FLD_HDR: result.FIELD_ID_FLD_HDR });
  } catch (error: any) {
    console.error("SaveFieldCombined error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateFieldCombined = async (req: Request, res: Response): Promise<void> => {
  const fieldData: FieldCombinedData = req.body;
  const { id } = req.params;

  try {
    if (id) {
      fieldData.FIELD_ID_FLD_HDR = parseInt(id as string, 10);
    }

    const result = await updateFieldCombinedService(fieldData);
    res.json({ success: true, message: result.message || "Field updated successfully" });
  } catch (error: any) {
    console.error("UpdateFieldCombined error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteFieldCombined = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Activity ID is required" });
    return;
  }

  try {
    const result = await deleteFieldCombinedService(parseInt(id as string, 10));
    res.json({ success: true, message: result.message || "Field detail deleted successfully" });
  } catch (error: any) {
    console.error("DeleteFieldCombined error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
