import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllProfessionalHunterMasterService,
  getProfessionalHunterMasterByIdService,
  saveProfessionalHunterMasterService,
  updateProfessionalHunterMasterService,
  deleteProfessionalHunterMasterService,
  ProfessionalHunterMasterData
} from "../services/professionalHunterMaster.services";

export const getAllProfessionalHunterMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawLinkId = req.query.LINK_ID ?? req.query.link_id;
    const linkId = rawLinkId != null && rawLinkId !== "" ? Number(rawLinkId) : null;
    const records = await getAllProfessionalHunterMasterService(
      linkId != null && Number.isFinite(linkId) ? linkId : null
    );
    res.json({ success: true, count: records.length, data: records });
  } catch (error: any) {
    console.error("GetAllProfessionalHunterMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getProfessionalHunterMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "PH_ID is required" });
    return;
  }

  try {
    const rawLinkId = req.query.LINK_ID ?? req.query.link_id;
    const linkId = rawLinkId != null && rawLinkId !== "" ? Number(rawLinkId) : null;
    const record = await getProfessionalHunterMasterByIdService(
      parseInt(id as string, 10),
      linkId != null && Number.isFinite(linkId) ? linkId : null
    );
    if (!record) {
      res.status(404).json({ success: false, message: "Professional hunter not found" });
      return;
    }
    res.json({ success: true, data: record });
  } catch (error: any) {
    console.error("GetProfessionalHunterMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveProfessionalHunterMaster = async (req: Request, res: Response): Promise<void> => {
  const data: ProfessionalHunterMasterData = req.body;

  if (!data.PH_NAME) {
    res.status(400).json({ success: false, message: "Hunter name is required" });
    return;
  }

  const { USER, MAC_ADDRESS } = identityFrom(req);
  data.USER = USER || data.USER || "Admin";
  data.MAC_ADDRESS = MAC_ADDRESS || data.MAC_ADDRESS || "WEB";

  try {
    const result = await saveProfessionalHunterMasterService(data);
    res.json({ success: true, message: result.message || "Data saved successfully", PH_ID: result.PH_ID });
  } catch (error: any) {
    console.error("SaveProfessionalHunterMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateProfessionalHunterMaster = async (req: Request, res: Response): Promise<void> => {
  const data: ProfessionalHunterMasterData = req.body;
  const { id } = req.params;

  try {
    if (!data.PH_ID && id) {
      data.PH_ID = parseInt(id as string, 10);
    }

    const { USER, MAC_ADDRESS } = identityFrom(req);
    data.USER = USER || data.USER || "Admin";
    data.MAC_ADDRESS = MAC_ADDRESS || data.MAC_ADDRESS || "WEB";

    const result = await updateProfessionalHunterMasterService(data);
    res.json({ success: true, message: result.message || "Record updated successfully", PH_ID: result.PH_ID });
  } catch (error: any) {
    console.error("UpdateProfessionalHunterMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteProfessionalHunterMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "PH_ID is required" });
    return;
  }

  try {
    const { USER: user, ROLE: role, MAC_ADDRESS: macAddress } = identityFrom(req);
    const result = await deleteProfessionalHunterMasterService(parseInt(id as string, 10), user, role, macAddress);
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteProfessionalHunterMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
