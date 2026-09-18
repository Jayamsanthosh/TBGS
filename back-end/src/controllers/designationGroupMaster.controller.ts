import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllDesignationGroupMasterService,
  getDesignationGroupMasterByIdService,
  saveDesignationGroupMasterService,
  updateDesignationGroupMasterService,
  deleteDesignationGroupMasterService,
  type DesignationGroupMasterData,
} from "../services/designationGroupMaster.services";

export const getAllDesignationGroupMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const items = await getAllDesignationGroupMasterService(status || undefined);
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllDesignationGroupMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getDesignationGroupMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "DESIGNATION_GROUP_ID is required" });
    return;
  }

  try {
    const item = await getDesignationGroupMasterByIdService(parseInt(id as string, 10));

    if (!item) {
      res.status(404).json({ success: false, message: "Designation group not found" });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetDesignationGroupMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

const VALID_STATUSES = ["AC", "IA"];

export const saveDesignationGroupMaster = async (req: Request, res: Response): Promise<void> => {
  const data: DesignationGroupMasterData = req.body;

  if (!data.DESIGNATION_GROUP_NAME?.trim()) {
    res.status(400).json({ success: false, message: "Designation group name is required" });
    return;
  }

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    const result = await saveDesignationGroupMasterService(data);
    res.json({ success: true, message: result.message || "Data saved successfully", DESIGNATION_GROUP_ID: result.DESIGNATION_GROUP_ID });
  } catch (error: any) {
    console.error("SaveDesignationGroupMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateDesignationGroupMaster = async (req: Request, res: Response): Promise<void> => {
  const data: DesignationGroupMasterData = req.body;
  const { id } = req.params;

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    if (!data.DESIGNATION_GROUP_ID && id) {
      data.DESIGNATION_GROUP_ID = parseInt(id as string, 10);
    }

    const result = await updateDesignationGroupMasterService(data);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateDesignationGroupMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteDesignationGroupMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "DESIGNATION_GROUP_ID is required" });
    return;
  }

  try {
    const result = await deleteDesignationGroupMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteDesignationGroupMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
