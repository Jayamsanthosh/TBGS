import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllGunTypeMasterService,
  getGunTypeMasterByIdService,
  saveGunTypeMasterService,
  updateGunTypeMasterService,
  deleteGunTypeMasterService,
  GunTypeMasterData
} from "../services/gunTypeMaster.services";

export const getAllGunTypeMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const gunTypes = await getAllGunTypeMasterService(status || undefined);
    res.json({ success: true, count: gunTypes.length, data: gunTypes });
  } catch (error: any) {
    console.error("GetAllGunTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getGunTypeMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Gun Type ID is required" });
    return;
  }

  try {
    const gunType = await getGunTypeMasterByIdService(parseInt(id as string, 10));

    if (!gunType) {
      res.status(404).json({ success: false, message: "Gun type not found" });
      return;
    }

    res.json({ success: true, data: gunType });
  } catch (error: any) {
    console.error("GetGunTypeMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveGunTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const gunTypeData: GunTypeMasterData = req.body;

  if (!gunTypeData.TYPE_NAME) {
    res.status(400).json({ success: false, message: "Type Name is required" });
    return;
  }

  try {
    const result = await saveGunTypeMasterService(gunTypeData);
    res.json({ success: true, message: result.message || "Gun type saved successfully" });
  } catch (error: any) {
    console.error("SaveGunTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateGunTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const gunTypeData: GunTypeMasterData = req.body;
  const { id } = req.params;

  try {
    if (!gunTypeData.GUN_TYPE_ID && id) {
      gunTypeData.GUN_TYPE_ID = parseInt(id as string, 10);
    }

    const result = await updateGunTypeMasterService(gunTypeData);
    res.json({ success: true, message: result.message || "Gun type updated successfully" });
  } catch (error: any) {
    console.error("UpdateGunTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteGunTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Gun Type ID is required" });
    return;
  }

  try {
    const result = await deleteGunTypeMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Gun type deleted successfully" });
  } catch (error: any) {
    console.error("DeleteGunTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
