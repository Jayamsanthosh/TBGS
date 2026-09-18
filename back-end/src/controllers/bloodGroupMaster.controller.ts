import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllBloodGroupMasterService,
  getBloodGroupMasterByIdService,
  saveBloodGroupMasterService,
  updateBloodGroupMasterService,
  deleteBloodGroupMasterService,
  BloodGroupMasterData
} from "../services/bloodGroupMaster.services";

const parseId = (raw: unknown): number | null => {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const authFrom = identityFrom;

export const getAllBloodGroupMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const bloodGroups = await getAllBloodGroupMasterService(status || "Active");
    res.json({ success: true, count: bloodGroups.length, data: bloodGroups });
  } catch (error: any) {
    console.error("GetAllBloodGroupMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getBloodGroupMasterById = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, message: "A valid Blood Group ID is required" });
    return;
  }
  try {
    const bloodGroup = await getBloodGroupMasterByIdService(id);
    if (!bloodGroup) {
      res.status(404).json({ success: false, message: "Blood group not found" });
      return;
    }
    res.json({ success: true, data: bloodGroup });
  } catch (error: any) {
    console.error("GetBloodGroupMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveBloodGroupMaster = async (req: Request, res: Response): Promise<void> => {
  const bloodGroupData: BloodGroupMasterData = req.body;
  if (!bloodGroupData.BLOOD_GROUP_NAME) {
    res.status(400).json({ success: false, message: "Blood Group Name is required" });
    return;
  }
  try {
    const result = await saveBloodGroupMasterService(bloodGroupData);
    res.json({ success: true, message: result.message || "Blood group saved successfully", BLOOD_GROUP_ID: result.BLOOD_GROUP_ID });
  } catch (error: any) {
    console.error("SaveBloodGroupMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateBloodGroupMaster = async (req: Request, res: Response): Promise<void> => {
  const bloodGroupData: BloodGroupMasterData = req.body;
  const id = parseId(req.params.id) ?? parseId(String(bloodGroupData.BLOOD_GROUP_ID ?? ""));
  if (!id) {
    res.status(400).json({ success: false, message: "A valid Blood Group ID is required" });
    return;
  }
  try {
    bloodGroupData.BLOOD_GROUP_ID = id;
    const result = await updateBloodGroupMasterService(bloodGroupData);
    res.json({ success: true, message: result.message || "Blood group updated successfully" });
  } catch (error: any) {
    console.error("UpdateBloodGroupMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteBloodGroupMaster = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, message: "A valid Blood Group ID is required" });
    return;
  }
  try {
    const { USER, ROLE, MAC_ADDRESS } = authFrom(req);
    const result = await deleteBloodGroupMasterService(id, USER, ROLE, MAC_ADDRESS);
    res.json({ success: true, message: result.message || "Blood group deleted successfully" });
  } catch (error: any) {
    console.error("DeleteBloodGroupMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
