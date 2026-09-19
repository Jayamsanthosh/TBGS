import { Request, Response } from "express";
import {
  getAllRoleToLinkService,
  getRoleToLinkByIdService,
  saveRoleToLinkService,
  updateRoleToLinkService,
  deleteRoleToLinkService,
  syncRoleToLinkService,
  RoleToLinkData
} from "../services/roleToLink.services";

export const getAllRoleToLink = async (_req: Request, res: Response): Promise<void> => {
  try {
    const links = await getAllRoleToLinkService();
    res.json({ success: true, count: links.length, data: links });
  } catch (error: any) {
    console.error("GetAllRoleToLink error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getRoleToLinkById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Role Link ID is required" });
    return;
  }

  try {
    const link = await getRoleToLinkByIdService(parseInt(id as string, 10));

    if (!link) {
      res.status(404).json({ success: false, message: "Role link not found" });
      return;
    }

    res.json({ success: true, data: link });
  } catch (error: any) {
    console.error("GetRoleToLinkById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveRoleToLink = async (req: Request, res: Response): Promise<void> => {
  const body = req.body;
  // Map STATUS_MASTER → STATUS_ROLE_TO_LINK if needed
  const linkData: RoleToLinkData = {
    ...body,
    STATUS_ROLE_TO_LINK: body.STATUS_ROLE_TO_LINK || body.STATUS_MASTER || 'AC',
  };

  if (!linkData.ROLE_ID_TO_LINK) {
    res.status(400).json({ success: false, message: "Role is required" });
    return;
  }

  if (!linkData.LINK_ID_ROLE_TO_LINK) {
    res.status(400).json({ success: false, message: "Link is required" });
    return;
  }

  try {
    const result = await saveRoleToLinkService(linkData);
    res.json({ success: true, message: result.message || "Role link saved successfully" });
  } catch (error: any) {
    console.error("SaveRoleToLink error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const syncRoleToLink = async (req: Request, res: Response): Promise<void> => {
  const body = req.body;
  const linkIds = Array.isArray(body.LINK_ID_ROLE_TO_LINK) ? body.LINK_ID_ROLE_TO_LINK : null;

  if (!body.ROLE_ID_TO_LINK) {
    res.status(400).json({ success: false, message: "Role is required" });
    return;
  }

  if (!linkIds || linkIds.length === 0) {
    res.status(400).json({ success: false, message: "At least one link is required" });
    return;
  }

  try {
    const result = await syncRoleToLinkService({
      ROLE_ID_TO_LINK: Number(body.ROLE_ID_TO_LINK),
      LINK_ID_ROLE_TO_LINK: linkIds,
      STATUS_ROLE_TO_LINK: body.STATUS_ROLE_TO_LINK || body.STATUS_MASTER || 'AC',
      USER_ROLE_TO_LINK: body.USER_ROLE_TO_LINK,
      MAC_ADDR_ROLE_TO_LINK: body.MAC_ADDR_ROLE_TO_LINK,
    });
    res.json({
      success: true,
      message: `Role links synchronized: ${result.added} added, ${result.updated} updated, ${result.deleted} removed`,
      added: result.added,
      updated: result.updated,
      deleted: result.deleted,
    });
  } catch (error: any) {
    console.error("SyncRoleToLink error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateRoleToLink = async (req: Request, res: Response): Promise<void> => {
  const body = req.body;
  // Map STATUS_MASTER → STATUS_ROLE_TO_LINK if needed
  const linkData: RoleToLinkData = {
    ...body,
    STATUS_ROLE_TO_LINK: body.STATUS_ROLE_TO_LINK || body.STATUS_MASTER || 'AC',
  };
  const { id } = req.params;

  try {
    if (!linkData.ROLE_TO_LINK_ID_ROLE_TO_LINK && id) {
      linkData.ROLE_TO_LINK_ID_ROLE_TO_LINK = parseInt(id as string, 10);
    }

    const result = await updateRoleToLinkService(linkData);
    res.json({ success: true, message: result.message || "Role link updated successfully" });
  } catch (error: any) {
    console.error("UpdateRoleToLink error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteRoleToLink = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Role Link ID is required" });
    return;
  }

  try {
    const result = await deleteRoleToLinkService(parseInt(id as string, 10));
    res.json({ success: true, message: result.message || "Role link deleted successfully" });
  } catch (error: any) {
    console.error("DeleteRoleToLink error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
