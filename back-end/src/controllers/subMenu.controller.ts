import { Request, Response } from "express";
import {
  getAllSubMenuService,
  getSubMenuByIdService,
  saveSubMenuService,
  updateSubMenuService,
  deleteSubMenuService,
  SubMenuData
} from "../services/subMenu.services";

export const getAllSubMenu = async (_req: Request, res: Response): Promise<void> => {
  try {
    const menus = await getAllSubMenuService();
    res.json({ success: true, count: menus.length, data: menus });
  } catch (error: any) {
    console.error("GetAllSubMenu error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getSubMenuById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Sub Menu ID is required" });
    return;
  }

  try {
    const menu = await getSubMenuByIdService(parseInt(id as string, 10));

    if (!menu) {
      res.status(404).json({ success: false, message: "Sub Menu not found" });
      return;
    }

    res.json({ success: true, data: menu });
  } catch (error: any) {
    console.error("GetSubMenuById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveSubMenu = async (req: Request, res: Response): Promise<void> => {
  const menuData: SubMenuData = req.body;

  if (!menuData.SUB_MENU_NAME) {
    res.status(400).json({ success: false, message: "Sub Menu Name is required" });
    return;
  }

  if (!menuData.MAIN_MENU_ID) {
    res.status(400).json({ success: false, message: "Main Menu is required" });
    return;
  }

  try {
    const result = await saveSubMenuService(menuData);
    res.json({ success: true, message: result.message || "Sub menu saved successfully", data: result.newSubMenuId });
  } catch (error: any) {
    console.error("SaveSubMenu error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateSubMenu = async (req: Request, res: Response): Promise<void> => {
  const menuData: SubMenuData = req.body;
  const { id } = req.params;

  try {
    if (!menuData.SUB_MENU_ID && id) {
      menuData.SUB_MENU_ID = parseInt(id as string, 10);
    }

    const result = await updateSubMenuService(menuData);
    res.json({ success: true, message: result.message || "Sub menu updated successfully" });
  } catch (error: any) {
    console.error("UpdateSubMenu error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteSubMenu = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Sub Menu ID is required" });
    return;
  }

  try {
    const result = await deleteSubMenuService(parseInt(id as string, 10));
    res.json({ success: true, message: result.message || "Sub menu deleted successfully" });
  } catch (error: any) {
    console.error("DeleteSubMenu error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
