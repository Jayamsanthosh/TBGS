import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  getAllPriorityMasterService,
  getPriorityMasterByIdService,
  savePriorityMasterService,
  updatePriorityMasterService,
  deletePriorityMasterService,
  PriorityMasterData
} from "../services/priorityMaster.services";

export const getAllPriorityMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
    const priorities = await getAllPriorityMasterService(status);
    res.json({ success: true, count: priorities.length, data: priorities });
  } catch (error: any) {
    console.error("GetAllPriorityMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPriorityMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Priority ID is required" });
    return;
  }

  try {
    const priority = await getPriorityMasterByIdService(parseInt(id as string, 10));

    if (!priority) {
      res.status(404).json({ success: false, message: "Priority not found" });
      return;
    }

    res.json({ success: true, data: priority });
  } catch (error: any) {
    console.error("GetPriorityMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const savePriorityMaster = async (req: Request, res: Response): Promise<void> => {
  const priorityData: PriorityMasterData = req.body;

  if (!priorityData.PRIORITY_NAME) {
    res.status(400).json({ success: false, message: "Priority Name is required" });
    return;
  }

  try {
    const result = await savePriorityMasterService(priorityData);
    res.json({ success: true, message: result.message || "Data saved successfully", PRIORITY_ID: result.PRIORITY_ID });
  } catch (error: any) {
    console.error("SavePriorityMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updatePriorityMaster = async (req: Request, res: Response): Promise<void> => {
  const priorityData: PriorityMasterData = req.body;
  const { id } = req.params;

  try {
    if (!priorityData.PRIORITY_ID && id) {
      priorityData.PRIORITY_ID = parseInt(id as string, 10);
    }

    const result = await updatePriorityMasterService(priorityData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdatePriorityMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deletePriorityMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Priority ID is required" });
    return;
  }

  try {
    const result = await deletePriorityMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeletePriorityMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};