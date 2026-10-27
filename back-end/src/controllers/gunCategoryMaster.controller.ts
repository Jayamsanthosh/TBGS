import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllGunCategoryMasterService,
  getGunCategoryMasterByIdService,
  saveGunCategoryMasterService,
  updateGunCategoryMasterService,
  deleteGunCategoryMasterService,
  GunCategoryMasterData
} from "../services/gunCategoryMaster.services";

export const getAllGunCategoryMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const gunCategories = await getAllGunCategoryMasterService(status || undefined);
    res.json({ success: true, count: gunCategories.length, data: gunCategories });
  } catch (error: any) {
    console.error("GetAllGunCategoryMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getGunCategoryMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Gun Category ID is required" });
    return;
  }

  const rawLinkId = req.query.LINK_ID ?? req.query.link_id;
  const linkId = rawLinkId != null && rawLinkId !== "" ? Number(rawLinkId) : null;

  try {
    const gunCategory = await getGunCategoryMasterByIdService(
      parseInt(id as string, 10),
      linkId != null && Number.isFinite(linkId) ? linkId : null
    );

    if (!gunCategory) {
      res.status(404).json({ success: false, message: "Gun category not found" });
      return;
    }

    res.json({ success: true, data: gunCategory });
  } catch (error: any) {
    console.error("GetGunCategoryMasterById error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveGunCategoryMaster = async (req: Request, res: Response): Promise<void> => {
  const gunCategoryData: GunCategoryMasterData = req.body;

  if (!gunCategoryData.GUN_CATEGORY_NAME) {
    res.status(400).json({ success: false, message: "Gun Category Name is required" });
    return;
  }

  try {
    const { USER, MAC_ADDRESS } = identityFrom(req);
    gunCategoryData.USER = USER || gunCategoryData.USER || "Admin";
    gunCategoryData.MAC_ADDRESS = MAC_ADDRESS || gunCategoryData.MAC_ADDRESS || "WEB";
    const rawLinkId = (gunCategoryData as any).LINK_ID ?? req.query.LINK_ID ?? req.query.link_id;
    const linkId = rawLinkId != null && rawLinkId !== "" ? Number(rawLinkId) : 120;
    (gunCategoryData as any).LINK_ID = linkId != null && Number.isFinite(linkId) ? linkId : 120;
    const result = await saveGunCategoryMasterService(gunCategoryData);
    res.json({ success: true, message: result.message || "Gun category saved successfully" });
  } catch (error: any) {
    console.error("SaveGunCategoryMaster error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateGunCategoryMaster = async (req: Request, res: Response): Promise<void> => {
  const gunCategoryData: GunCategoryMasterData = req.body;
  const { id } = req.params;

  try {
    if (!gunCategoryData.GUN_CATEGORY_ID && id) {
      gunCategoryData.GUN_CATEGORY_ID = parseInt(id as string, 10);
    }
    const { USER, MAC_ADDRESS } = identityFrom(req);
    gunCategoryData.USER = USER || gunCategoryData.USER || "Admin";
    gunCategoryData.MAC_ADDRESS = MAC_ADDRESS || gunCategoryData.MAC_ADDRESS || "WEB";
    const rawLinkId = (gunCategoryData as any).LINK_ID ?? req.query.LINK_ID ?? req.query.link_id;
    const linkId = rawLinkId != null && rawLinkId !== "" ? Number(rawLinkId) : 120;
    (gunCategoryData as any).LINK_ID = linkId != null && Number.isFinite(linkId) ? linkId : 120;

    const result = await updateGunCategoryMasterService(gunCategoryData);
    res.json({ success: true, message: result.message || "Gun category updated successfully" });
  } catch (error: any) {
    console.error("UpdateGunCategoryMaster error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteGunCategoryMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Gun Category ID is required" });
    return;
  }

  try {
    const result = await deleteGunCategoryMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Gun category deleted successfully" });
  } catch (error: any) {
    console.error("DeleteGunCategoryMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
