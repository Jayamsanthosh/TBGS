import { Request, Response } from "express";
import {
  getAllAmmunitionBrandMasterService,
  getAmmunitionBrandMasterByIdService,
  saveAmmunitionBrandMasterService,
  updateAmmunitionBrandMasterService,
  deleteAmmunitionBrandMasterService,
  AmmunitionBrandMasterData
} from "../services/ammunitionBrandMaster.services";

export const getAllAmmunitionBrandMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "AC";
    const brands = await getAllAmmunitionBrandMasterService(status);
    res.json({ success: true, count: brands.length, data: brands });
  } catch (error: any) {
    console.error("GetAllAmmunitionBrandMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getAmmunitionBrandMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Ammunition Brand ID is required" });
    return;
  }

  try {
    const brand = await getAmmunitionBrandMasterByIdService(parseInt(id as string, 10));

    if (!brand) {
      res.status(404).json({ success: false, message: "Ammunition brand not found" });
      return;
    }

    res.json({ success: true, data: brand });
  } catch (error: any) {
    console.error("GetAmmunitionBrandMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveAmmunitionBrandMaster = async (req: Request, res: Response): Promise<void> => {
  const brandData: AmmunitionBrandMasterData = req.body;

  if (!brandData.BRAND_NAME) {
    res.status(400).json({ success: false, message: "Brand Name is required" });
    return;
  }

  try {
    const result = await saveAmmunitionBrandMasterService(brandData);
    res.json({ success: true, message: result.message || "Data saved successfully", AMMUNITION_BRAND_ID: result.AMMUNITION_BRAND_ID });
  } catch (error: any) {
    console.error("SaveAmmunitionBrandMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateAmmunitionBrandMaster = async (req: Request, res: Response): Promise<void> => {
  const brandData: AmmunitionBrandMasterData = req.body;
  const { id } = req.params;

  try {
    if (!brandData.AMMUNITION_BRAND_ID && id) {
      brandData.AMMUNITION_BRAND_ID = parseInt(id as string, 10);
    }

    const result = await updateAmmunitionBrandMasterService(brandData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateAmmunitionBrandMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteAmmunitionBrandMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Ammunition Brand ID is required" });
    return;
  }

  try {
    const result = await deleteAmmunitionBrandMasterService(parseInt(id as string, 10));
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteAmmunitionBrandMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
