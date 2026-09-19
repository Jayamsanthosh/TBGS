import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  getAllBranchMasterService,
  getBranchMasterByIdService,
  saveBranchMasterService,
  updateBranchMasterService,
  deleteBranchMasterService,
  BranchMasterData
} from "../services/branchMaster.services";

export const getAllBranchMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
    const branches = await getAllBranchMasterService(status);
    res.json({ success: true, count: branches.length, data: branches });
  } catch (error: any) {
    console.error("GetAllBranchMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getBranchMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Branch ID is required" });
    return;
  }

  try {
    const branch = await getBranchMasterByIdService(parseInt(id as string, 10));

    if (!branch) {
      res.status(404).json({ success: false, message: "Branch not found" });
      return;
    }

    res.json({ success: true, data: branch });
  } catch (error: any) {
    console.error("GetBranchMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveBranchMaster = async (req: Request, res: Response): Promise<void> => {
  const branchData: BranchMasterData = req.body;

  if (!branchData.BRANCH_NAME) {
    res.status(400).json({ success: false, message: "Branch Name is required" });
    return;
  }

  try {
    const result = await saveBranchMasterService(branchData);
    res.json({ success: true, message: result.message || "Data saved successfully", BRANCH_ID: result.BRANCH_ID });
  } catch (error: any) {
    console.error("SaveBranchMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateBranchMaster = async (req: Request, res: Response): Promise<void> => {
  const branchData: BranchMasterData = req.body;
  const { id } = req.params;

  try {
    if (!branchData.BRANCH_ID && id) {
      branchData.BRANCH_ID = parseInt(id as string, 10);
    }

    const result = await updateBranchMasterService(branchData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateBranchMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteBranchMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Branch ID is required" });
    return;
  }

  try {
    const result = await deleteBranchMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteBranchMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};