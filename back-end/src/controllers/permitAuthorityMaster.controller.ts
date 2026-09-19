import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  getAllPermitAuthorityMasterService,
  getPermitAuthorityMasterByIdService,
  savePermitAuthorityMasterService,
  updatePermitAuthorityMasterService,
  deletePermitAuthorityMasterService,
  PermitAuthorityMasterData
} from "../services/permitAuthorityMaster.services";

export const getAllPermitAuthorityMaster = async (req: Request, res: Response): Promise<void> => {
  const status = (req.query.status as string) || "ALL";

  try {
    const permitAuthorities = await getAllPermitAuthorityMasterService(status);
    res.json({ success: true, count: permitAuthorities.length, data: permitAuthorities });
  } catch (error: any) {
    console.error("GetAllPermitAuthorityMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPermitAuthorityMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Permit Authority ID is required" });
    return;
  }

  try {
    const permitAuthority = await getPermitAuthorityMasterByIdService(parseInt(id as string, 10));

    if (!permitAuthority) {
      res.status(404).json({ success: false, message: "Permit Authority not found" });
      return;
    }

    res.json({ success: true, data: permitAuthority });
  } catch (error: any) {
    console.error("GetPermitAuthorityMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const savePermitAuthorityMaster = async (req: Request, res: Response): Promise<void> => {
  const permitAuthorityData: PermitAuthorityMasterData = req.body;

  if (!permitAuthorityData.PERMIT_AUTHORITY_NAME) {
    res.status(400).json({ success: false, message: "Permit Authority Name is required" });
    return;
  }

  try {
    const result = await savePermitAuthorityMasterService(permitAuthorityData);
    res.json({ success: true, message: result.message || "Permit authority saved successfully" });
  } catch (error: any) {
    console.error("SavePermitAuthorityMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updatePermitAuthorityMaster = async (req: Request, res: Response): Promise<void> => {
  const permitAuthorityData: PermitAuthorityMasterData = req.body;
  const { id } = req.params;

  try {
    if (!permitAuthorityData.PERMIT_AUTHORITY_ID && id) {
      permitAuthorityData.PERMIT_AUTHORITY_ID = parseInt(id as string, 10);
    }

    if (!permitAuthorityData.PERMIT_AUTHORITY_ID) {
      res.status(400).json({ success: false, message: "Permit Authority ID is required" });
      return;
    }

    const result = await updatePermitAuthorityMasterService(permitAuthorityData);
    res.json({ success: true, message: result.message || "Permit authority updated successfully" });
  } catch (error: any) {
    console.error("UpdatePermitAuthorityMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deletePermitAuthorityMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Permit Authority ID is required" });
    return;
  }

  try {
    const result = await deletePermitAuthorityMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Permit authority deleted successfully" });
  } catch (error: any) {
    console.error("DeletePermitAuthorityMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};