import { Request, Response } from "express";
import {
  getAllBulletTypeMasterService,
  getBulletTypeMasterByIdService,
  saveBulletTypeMasterService,
  updateBulletTypeMasterService,
  deleteBulletTypeMasterService,
  BulletTypeMasterData
} from "../services/bulletTypeMaster.services";

export const getAllBulletTypeMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "AC";
    const bullets = await getAllBulletTypeMasterService(status);
    res.json({ success: true, count: bullets.length, data: bullets });
  } catch (error: any) {
    console.error("GetAllBulletTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getBulletTypeMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Bullet Type ID is required" });
    return;
  }

  try {
    const bullet = await getBulletTypeMasterByIdService(parseInt(id as string, 10));

    if (!bullet) {
      res.status(404).json({ success: false, message: "Bullet type not found" });
      return;
    }

    res.json({ success: true, data: bullet });
  } catch (error: any) {
    console.error("GetBulletTypeMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveBulletTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const bulletData: BulletTypeMasterData = req.body;

  if (!bulletData.BULLET_TYPE_NAME) {
    res.status(400).json({ success: false, message: "Bullet Type Name is required" });
    return;
  }

  try {
    const result = await saveBulletTypeMasterService(bulletData);
    res.json({ success: true, message: result.message || "Data saved successfully", BULLET_TYPE_ID: result.BULLET_TYPE_ID });
  } catch (error: any) {
    console.error("SaveBulletTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateBulletTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const bulletData: BulletTypeMasterData = req.body;
  const { id } = req.params;

  try {
    if (!bulletData.BULLET_TYPE_ID && id) {
      bulletData.BULLET_TYPE_ID = parseInt(id as string, 10);
    }

    const result = await updateBulletTypeMasterService(bulletData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateBulletTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteBulletTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Bullet Type ID is required" });
    return;
  }

  try {
    const result = await deleteBulletTypeMasterService(parseInt(id as string, 10));
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteBulletTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
