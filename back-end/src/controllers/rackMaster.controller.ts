import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllRackMasterService,
  getRackMasterByIdService,
  saveRackMasterService,
  updateRackMasterService,
  deleteRackMasterService,
  RackMasterData
} from "../services/rackMaster.services";

export const getAllRackMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawLinkId = req.query.LINK_ID ?? req.query.link_id;
    const linkId = rawLinkId != null && rawLinkId !== "" ? Number(rawLinkId) : null;
    const records = await getAllRackMasterService(
      linkId != null && Number.isFinite(linkId) ? linkId : null
    );
    res.json({ success: true, count: records.length, data: records });
  } catch (error: any) {
    console.error("GetAllRackMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getRackMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "RACK_ID is required" });
    return;
  }

  try {
    const rawLinkId = req.query.LINK_ID ?? req.query.link_id;
    const linkId = rawLinkId != null && rawLinkId !== "" ? Number(rawLinkId) : null;
    const record = await getRackMasterByIdService(
      parseInt(id as string, 10),
      linkId != null && Number.isFinite(linkId) ? linkId : null
    );
    if (!record) {
      res.status(404).json({ success: false, message: "Rack not found" });
      return;
    }
    res.json({ success: true, data: record });
  } catch (error: any) {
    console.error("GetRackMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveRackMaster = async (req: Request, res: Response): Promise<void> => {
  const data: RackMasterData = req.body;

  if (!data.RACK_NAME) {
    res.status(400).json({ success: false, message: "Rack name is required" });
    return;
  }

  if (data.RACK_NAME.length > 40) {
    res.status(400).json({ success: false, message: "Rack name must be 40 characters or less" });
    return;
  }

  const { USER, MAC_ADDRESS } = identityFrom(req);
  data.USER = USER || data.USER || "Admin";
  data.MAC_ADDRESS = MAC_ADDRESS || data.MAC_ADDRESS || "WEB";

  try {
    const result = await saveRackMasterService(data);
    res.json({ success: true, message: result.message || "Data saved successfully", RACK_ID: result.RACK_ID });
  } catch (error: any) {
    console.error("SaveRackMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateRackMaster = async (req: Request, res: Response): Promise<void> => {
  const data: RackMasterData = req.body;
  const { id } = req.params;

  try {
    if (!data.RACK_ID && id) {
      data.RACK_ID = parseInt(id as string, 10);
    }

    const { USER, MAC_ADDRESS } = identityFrom(req);
    data.USER = USER || data.USER || "Admin";
    data.MAC_ADDRESS = MAC_ADDRESS || data.MAC_ADDRESS || "WEB";

    const result = await updateRackMasterService(data);
    res.json({ success: true, message: result.message || "Record updated successfully", RACK_ID: result.RACK_ID });
  } catch (error: any) {
    console.error("UpdateRackMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteRackMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "RACK_ID is required" });
    return;
  }

  try {
    const { USER: user, ROLE: role, MAC_ADDRESS: macAddress } = identityFrom(req);
    const result = await deleteRackMasterService(parseInt(id as string, 10), user, role, macAddress);
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteRackMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
