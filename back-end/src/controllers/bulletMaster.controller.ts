import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllBulletMasterService,
  getBulletMasterByIdService,
  saveBulletMasterService,
  updateBulletMasterService,
  deleteBulletMasterService,
  type BulletMasterData,
} from "../services/bulletMaster.services";

export const getAllBulletMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      ammunitionBrandId,
      caliberId,
      status,
    } = req.query;

    const bullets = await getAllBulletMasterService({
      ammunitionBrandId: ammunitionBrandId as string,
      caliberId: caliberId as string,
      status: status as string,
    });

    res.json({ success: true, count: bullets.length, data: bullets });
  } catch (error: any) {
    console.error("GetAllBulletMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getBulletMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "BULLET ID is required" });
    return;
  }

  try {
    const bullet = await getBulletMasterByIdService(parseInt(id as string, 10));

    if (!bullet) {
      res.status(404).json({ success: false, message: "Bullet not found" });
      return;
    }

    res.json({ success: true, data: bullet });
  } catch (error: any) {
    console.error("GetBulletMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

const VALID_STATUSES = ["AC", "IA"];

export const saveBulletMaster = async (req: Request, res: Response): Promise<void> => {
  const bulletData: BulletMasterData = req.body;

  if (!bulletData.BULLET_NAME) {
    res.status(400).json({ success: false, message: "Bullet Name is required" });
    return;
  }

  if (bulletData.STATUS_MASTER && !VALID_STATUSES.includes(bulletData.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    const result = await saveBulletMasterService(bulletData);
    res.json({ success: true, message: result.message || "Data saved successfully", BULLET_ID: result.BULLET_ID });
  } catch (error: any) {
    console.error("SaveBulletMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateBulletMaster = async (req: Request, res: Response): Promise<void> => {
  const bulletData: BulletMasterData = req.body;
  const { id } = req.params;

  if (bulletData.STATUS_MASTER && !VALID_STATUSES.includes(bulletData.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    if (!bulletData.BULLET_ID && id) {
      bulletData.BULLET_ID = parseInt(id as string, 10);
    }

    const result = await updateBulletMasterService(bulletData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateBulletMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteBulletMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "BULLET ID is required" });
    return;
  }

  try {
    const result = await deleteBulletMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Data deleted successfully" });
  } catch (error: any) {
    console.error("DeleteBulletMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
