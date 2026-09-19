import { Request, Response } from "express";
import {
  getAllMainMenuService,
  getMainMenuByIdService,
  saveMainMenuService,
  updateMainMenuService,
  deleteMainMenuService,
  MainMenuData
} from "../services/mainMenu.services";

export const getAllMainMenu = async (_req: Request, res: Response): Promise<void> => {
  try {
    const menus = await getAllMainMenuService();
    res.json({ success: true, count: menus.length, data: menus });
  } catch (error: any) {
    console.error("GetAllMainMenu error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getMainMenuById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Main Menu ID is required" });
    return;
  }

  try {
    const menu = await getMainMenuByIdService(parseInt(id as string, 10));

    if (!menu) {
      res.status(404).json({ success: false, message: "Main Menu not found" });
      return;
    }

    res.json({ success: true, data: menu });
  } catch (error: any) {
    console.error("GetMainMenuById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveMainMenu = async (req: Request, res: Response): Promise<void> => {
  const menuData: MainMenuData = req.body;

  if (!menuData.MAIN_MENU_NAME) {
    res.status(400).json({ success: false, message: "Main Menu Name is required" });
    return;
  }

  try {
    const result = await saveMainMenuService(menuData);
    res.json({ success: true, message: result.message || "Main menu saved successfully", data: result.newMenuId });
  } catch (error: any) {
    console.error("SaveMainMenu error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateMainMenu = async (req: Request, res: Response): Promise<void> => {
  const menuData: MainMenuData = req.body;
  const { id } = req.params;

  try {
    if (!menuData.MAIN_MENU_ID && id) {
      menuData.MAIN_MENU_ID = parseInt(id as string, 10);
    }

    const result = await updateMainMenuService(menuData);
    res.json({ success: true, message: result.message || "Main menu updated successfully" });
  } catch (error: any) {
    console.error("UpdateMainMenu error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteMainMenu = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Main Menu ID is required" });
    return;
  }

  try {
    const result = await deleteMainMenuService(parseInt(id as string, 10));
    res.json({ success: true, message: result.message || "Main menu deleted successfully" });
  } catch (error: any) {
    console.error("DeleteMainMenu error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
