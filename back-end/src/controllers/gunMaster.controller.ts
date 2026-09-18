import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllGunMasterService,
  getGunMasterByIdService,
  saveGunMasterService,
  updateGunMasterService,
  deleteGunMasterService,
  type GunMasterData,
} from "../services/gunMaster.services";

export const getAllGunMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      gunCategoryId,
      gunTypeId,
      gunBrandId,
      caliberId,
      campId,
      storeId,
      status,
    } = req.query;

    const guns = await getAllGunMasterService({
      gunCategoryId: gunCategoryId as string,
      gunTypeId: gunTypeId as string,
      gunBrandId: gunBrandId as string,
      caliberId: caliberId as string,
      campId: campId as string,
      storeId: storeId as string,
      status: status as string,
    });

    res.json({ success: true, count: guns.length, data: guns });
  } catch (error: any) {
    console.error("GetAllGunMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getGunMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "GUN ID is required" });
    return;
  }

  try {
    const gun = await getGunMasterByIdService(parseInt(id as string, 10));

    if (!gun) {
      res.status(404).json({ success: false, message: "Gun not found" });
      return;
    }

    res.json({ success: true, data: gun });
  } catch (error: any) {
    console.error("GetGunMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

const VALID_STATUSES = ["AC", "IA"];

export const saveGunMaster = async (req: Request, res: Response): Promise<void> => {
  const gunData: GunMasterData = req.body;

  if (!gunData.GUN_NAME) {
    res.status(400).json({ success: false, message: "Gun Name is required" });
    return;
  }

  if (gunData.STATUS_MASTER && !VALID_STATUSES.includes(gunData.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    const result = await saveGunMasterService(gunData);
    res.json({ success: true, message: result.message || "Data saved successfully", GUN_ID: result.GUN_ID });
  } catch (error: any) {
    console.error("SaveGunMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateGunMaster = async (req: Request, res: Response): Promise<void> => {
  const gunData: GunMasterData = req.body;
  const { id } = req.params;

  if (gunData.STATUS_MASTER && !VALID_STATUSES.includes(gunData.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    if (!gunData.GUN_ID && id) {
      gunData.GUN_ID = parseInt(id as string, 10);
    }

    const result = await updateGunMasterService(gunData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateGunMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteGunMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "GUN ID is required" });
    return;
  }

  try {
    const result = await deleteGunMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteGunMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
