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

const parseId = (raw: unknown): number | null => {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
};

export const getAllPermitAuthorityMaster = async (req: Request, res: Response): Promise<void> => {
  const status = (req.query.status as string) || "ALL";

  try {
    const permitAuthorities = await getAllPermitAuthorityMasterService(status);
    res.json({ success: true, count: permitAuthorities.length, data: permitAuthorities });
  } catch (error: any) {
    console.error("GetAllPermitAuthorityMaster error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPermitAuthorityMasterById = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);

  if (!id) {
    res.status(400).json({ success: false, message: "A valid Permit Authority ID is required" });
    return;
  }

  try {
    const rawLinkId = req.query.LINK_ID ?? req.query.link_id;
    const linkId = rawLinkId != null && rawLinkId !== "" ? Number(rawLinkId) : null;
    const permitAuthority = await getPermitAuthorityMasterByIdService(id, Number.isFinite(linkId) ? linkId : null);

    if (!permitAuthority) {
      res.status(404).json({ success: false, message: "Permit Authority not found" });
      return;
    }

    res.json({ success: true, data: permitAuthority });
  } catch (error: any) {
    console.error("GetPermitAuthorityMasterById error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const savePermitAuthorityMaster = async (req: Request, res: Response): Promise<void> => {
  const permitAuthorityData: PermitAuthorityMasterData = req.body;

  if (!permitAuthorityData.PERMIT_AUTHORITY_NAME?.trim()) {
    res.status(400).json({ success: false, message: "Permit Authority Name is required" });
    return;
  }

  const { USER, MAC_ADDRESS } = identityFrom(req);
  permitAuthorityData.USER = USER || permitAuthorityData.USER || "Admin";
  permitAuthorityData.MAC_ADDRESS = MAC_ADDRESS || permitAuthorityData.MAC_ADDRESS || "WEB";
  if (permitAuthorityData.LINK_ID === undefined || permitAuthorityData.LINK_ID === null) {
    permitAuthorityData.LINK_ID = 252;
  }

  try {
    const result = await savePermitAuthorityMasterService(permitAuthorityData);
    res.json({
      success: true,
      message: result.message || "Data Saved Successfully",
      data: result.PERMIT_AUTHORITY_ID,
      PERMIT_AUTHORITY_ID: result.PERMIT_AUTHORITY_ID,
    });
  } catch (error: any) {
    console.error("SavePermitAuthorityMaster error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updatePermitAuthorityMaster = async (req: Request, res: Response): Promise<void> => {
  const permitAuthorityData: PermitAuthorityMasterData = req.body;
  const id = parseId(req.params.id) ?? parseId(permitAuthorityData.PERMIT_AUTHORITY_ID);

  if (!id) {
    res.status(400).json({ success: false, message: "A valid Permit Authority ID is required" });
    return;
  }

  if (!permitAuthorityData.PERMIT_AUTHORITY_NAME?.trim()) {
    res.status(400).json({ success: false, message: "Permit Authority Name is required" });
    return;
  }

  permitAuthorityData.PERMIT_AUTHORITY_ID = id;
  const { USER, MAC_ADDRESS } = identityFrom(req);
  permitAuthorityData.USER = USER || permitAuthorityData.USER || "Admin";
  permitAuthorityData.MAC_ADDRESS = MAC_ADDRESS || permitAuthorityData.MAC_ADDRESS || "WEB";
  if (permitAuthorityData.LINK_ID === undefined || permitAuthorityData.LINK_ID === null) {
    permitAuthorityData.LINK_ID = 252;
  }

  try {
    const result = await updatePermitAuthorityMasterService(permitAuthorityData);
    res.json({
      success: true,
      message: result.message || "Data Updated Successfully",
      data: result.PERMIT_AUTHORITY_ID,
      PERMIT_AUTHORITY_ID: result.PERMIT_AUTHORITY_ID,
    });
  } catch (error: any) {
    console.error("UpdatePermitAuthorityMaster error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deletePermitAuthorityMaster = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "A valid Permit Authority ID is required" });
    return;
  }

  try {
    const result = await deletePermitAuthorityMasterService(
      id,
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Data Deleted Successfully" });
  } catch (error: any) {
    console.error("DeletePermitAuthorityMaster error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};