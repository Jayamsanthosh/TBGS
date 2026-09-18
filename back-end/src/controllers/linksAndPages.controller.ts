import { Request, Response } from "express";
import {
  getAllLinksAndPagesService,
  getLinkAndPageByIdService,
  saveLinkAndPageService,
  updateLinkAndPageService,
  deleteLinkAndPageService,
  LinksAndPagesData
} from "../services/linksAndPages.services";

export const getAllLinksAndPages = async (_req: Request, res: Response): Promise<void> => {
  try {
    const links = await getAllLinksAndPagesService();
    res.json({ success: true, count: links.length, data: links });
  } catch (error: any) {
    console.error("GetAllLinksAndPages error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getLinkAndPageById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Link ID is required" });
    return;
  }

  try {
    const link = await getLinkAndPageByIdService(parseInt(id as string, 10));

    if (!link) {
      res.status(404).json({ success: false, message: "Link not found" });
      return;
    }

    res.json({ success: true, data: link });
  } catch (error: any) {
    console.error("GetLinkAndPageById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveLinkAndPage = async (req: Request, res: Response): Promise<void> => {
  const linkData: LinksAndPagesData = req.body;

  if (!linkData.LINK_NAME) {
    res.status(400).json({ success: false, message: "Link Name is required" });
    return;
  }

  if (!linkData.SUB_MENU_ID) {
    res.status(400).json({ success: false, message: "Sub Menu is required" });
    return;
  }

  try {
    const result = await saveLinkAndPageService(linkData);
    res.json({ success: true, message: result.message || "Link saved successfully" });
  } catch (error: any) {
    console.error("SaveLinkAndPage error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateLinkAndPage = async (req: Request, res: Response): Promise<void> => {
  const linkData: LinksAndPagesData = req.body;
  const { id } = req.params;

  try {
    if (!linkData.LINK_ID && id) {
      linkData.LINK_ID = parseInt(id as string, 10);
    }

    const result = await updateLinkAndPageService(linkData);
    res.json({ success: true, message: result.message || "Link updated successfully" });
  } catch (error: any) {
    console.error("UpdateLinkAndPage error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteLinkAndPage = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Link ID is required" });
    return;
  }

  try {
    const result = await deleteLinkAndPageService(parseInt(id as string, 10));
    res.json({ success: true, message: result.message || "Link deleted successfully" });
  } catch (error: any) {
    console.error("DeleteLinkAndPage error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
