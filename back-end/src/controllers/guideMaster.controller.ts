import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  getAllGuideMasterService,
  getGuideMasterByIdService,
  saveGuideMasterService,
  updateGuideMasterService,
  deleteGuideMasterService,
  toGuideLinkId,
  GuideMasterData,
} from "../services/guideMaster.services";

const LIMITS = {
  GUIDE_NAME: 50,
  GUIDE_DESCRIPTION: 50,
  REMARKS: 1000,
} as const;

const linkIdFrom = (req: Request, body?: GuideMasterData): number => {
  const fromBody = body?.LINK_ID as unknown;
  if (fromBody !== undefined && fromBody !== null && fromBody !== "") {
    return toGuideLinkId(fromBody);
  }
  const fromQuery =
    (req.query.link_id as string) ?? (req.query.linkId as string) ?? (req.body?.LINK_ID as string);
  return toGuideLinkId(fromQuery);
};

const validateGuidePayload = (data: GuideMasterData): string | null => {
  if (!data.GUIDE_NAME || !String(data.GUIDE_NAME).trim()) return "Guide Name is required";

  if (String(data.GUIDE_NAME).trim().length > LIMITS.GUIDE_NAME) {
    return `Guide Name must be ${LIMITS.GUIDE_NAME} characters or less`;
  }
  if (
    data.GUIDE_DESCRIPTION &&
    String(data.GUIDE_DESCRIPTION).trim().length > LIMITS.GUIDE_DESCRIPTION
  ) {
    return `Guide Description must be ${LIMITS.GUIDE_DESCRIPTION} characters or less`;
  }
  if (data.REMARKS && String(data.REMARKS).trim().length > LIMITS.REMARKS) {
    return `Remarks must be ${LIMITS.REMARKS} characters or less`;
  }
  return null;
};

export const getAllGuideMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
    const guides = await getAllGuideMasterService(status);
    res.json({ success: true, count: guides.length, data: guides });
  } catch (error: any) {
    console.error("GetAllGuideMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getGuideMasterById = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);

  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ success: false, message: "Guide ID is required" });
    return;
  }

  try {
    const guide = await getGuideMasterByIdService(id);

    if (!guide) {
      res.status(404).json({ success: false, message: "Guide not found" });
      return;
    }

    res.json({ success: true, data: guide });
  } catch (error: any) {
    console.error("GetGuideMasterById error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveGuideMaster = async (req: Request, res: Response): Promise<void> => {
  const guideData: GuideMasterData = req.body;

  const validationError = validateGuidePayload(guideData);
  if (validationError) {
    res.status(400).json({ success: false, message: validationError });
    return;
  }

  guideData.GUIDE_NAME = guideData.GUIDE_NAME.trim();
  guideData.LINK_ID = linkIdFrom(req, guideData);

  try {
    const result = await saveGuideMasterService(guideData);
    res.json({
      success: true,
      message: result.message || "Guide saved successfully",
      GUIDE_ID: result.GUIDE_ID,
    });
  } catch (error: any) {
    console.error("SaveGuideMaster error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateGuideMaster = async (req: Request, res: Response): Promise<void> => {
  const guideData: GuideMasterData = req.body;
  const { id } = req.params;

  if (!guideData.GUIDE_ID && id) {
    guideData.GUIDE_ID = parseInt(id as string, 10);
  }

  if (!guideData.GUIDE_ID || !Number.isFinite(Number(guideData.GUIDE_ID))) {
    res.status(400).json({ success: false, message: "Guide ID is required" });
    return;
  }

  const validationError = validateGuidePayload(guideData);
  if (validationError) {
    res.status(400).json({ success: false, message: validationError });
    return;
  }

  guideData.GUIDE_NAME = guideData.GUIDE_NAME.trim();
  guideData.LINK_ID = linkIdFrom(req, guideData);

  try {
    const result = await updateGuideMasterService(guideData);
    res.json({ success: true, message: result.message || "Guide updated successfully" });
  } catch (error: any) {
    console.error("UpdateGuideMaster error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteGuideMaster = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);

  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ success: false, message: "Guide ID is required" });
    return;
  }

  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  try {
    const result = await deleteGuideMasterService(id, USER, ROLE, MAC_ADDRESS);
    res.json({ success: true, message: result.message || "Guide deleted successfully" });
  } catch (error: any) {
    console.error("DeleteGuideMaster error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
