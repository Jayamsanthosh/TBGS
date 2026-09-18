import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllDesignationMasterService,
  getDesignationMasterByIdService,
  saveDesignationMasterService,
  updateDesignationMasterService,
  deleteDesignationMasterService,
  DesignationMasterData
} from "../services/designationMaster.services";

export const getAllDesignationMaster = async (_req: Request, res: Response): Promise<void> => {
  try {
    const designations = await getAllDesignationMasterService();
    res.json({ success: true, count: designations.length, data: designations });
  } catch (error: any) {
    console.error("GetAllDesignationMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getDesignationMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Designation ID is required" });
    return;
  }

  try {
    const designation = await getDesignationMasterByIdService(parseInt(id as string, 10));

    if (!designation) {
      res.status(404).json({ success: false, message: "Designation not found" });
      return;
    }

    res.json({ success: true, data: designation });
  } catch (error: any) {
    console.error("GetDesignationMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveDesignationMaster = async (req: Request, res: Response): Promise<void> => {
  const designationData: DesignationMasterData = req.body;

  if (!designationData.DESIGNATION_NAME) {
    res.status(400).json({ success: false, message: "Designation Name is required" });
    return;
  }

  try {
    const result = await saveDesignationMasterService(designationData);
    res.json({ success: true, message: result.message || "Designation saved successfully" });
  } catch (error: any) {
    console.error("SaveDesignationMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateDesignationMaster = async (req: Request, res: Response): Promise<void> => {
  const designationData: DesignationMasterData = req.body;
  const { id } = req.params;

  try {
    if (!designationData.DESIGNATION_ID && id) {
      designationData.DESIGNATION_ID = parseInt(id as string, 10);
    }

    const result = await updateDesignationMasterService(designationData);
    res.json({ success: true, message: result.message || "Designation updated successfully" });
  } catch (error: any) {
    console.error("UpdateDesignationMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteDesignationMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Designation ID is required" });
    return;
  }

  try {
    const result = await deleteDesignationMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Designation deleted successfully" });
  } catch (error: any) {
    console.error("DeleteDesignationMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
