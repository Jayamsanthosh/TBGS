import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllGunBrandMasterService,
  getGunBrandMasterByIdService,
  saveGunBrandMasterService,
  updateGunBrandMasterService,
  deleteGunBrandMasterService,
  GunBrandMasterData
} from "../services/gunBrandMaster.services";

export const getAllGunBrandMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
    const brands = await getAllGunBrandMasterService(status);
    res.json({ success: true, count: brands.length, data: brands });
  } catch (error: any) {
    console.error("GetAllGunBrandMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getGunBrandMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Gun Brand ID is required" });
    return;
  }

  try {
    const brand = await getGunBrandMasterByIdService(parseInt(id as string, 10));

    if (!brand) {
      res.status(404).json({ success: false, message: "Gun brand not found" });
      return;
    }

    res.json({ success: true, data: brand });
  } catch (error: any) {
    console.error("GetGunBrandMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveGunBrandMaster = async (req: Request, res: Response): Promise<void> => {
  const brandData: GunBrandMasterData = req.body;

  if (!brandData.BRAND_NAME) {
    res.status(400).json({ success: false, message: "Brand Name is required" });
    return;
  }

  try {
    const result = await saveGunBrandMasterService(brandData);
    res.json({ success: true, message: result.message || "Data saved successfully", GUN_BRAND_ID: result.GUN_BRAND_ID });
  } catch (error: any) {
    console.error("SaveGunBrandMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateGunBrandMaster = async (req: Request, res: Response): Promise<void> => {
  const brandData: GunBrandMasterData = req.body;
  const { id } = req.params;

  try {
    if (!brandData.GUN_BRAND_ID && id) {
      brandData.GUN_BRAND_ID = parseInt(id as string, 10);
    }

    const result = await updateGunBrandMasterService(brandData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateGunBrandMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteGunBrandMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Gun Brand ID is required" });
    return;
  }

  try {
    const result = await deleteGunBrandMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteGunBrandMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
