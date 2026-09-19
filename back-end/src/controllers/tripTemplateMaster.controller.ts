import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllTripTemplateMasterService,
  getTripTemplateMasterByIdService,
  saveTripTemplateMasterService,
  updateTripTemplateMasterService,
  deleteTripTemplateMasterService,
  TripTemplateMasterData
} from "../services/tripTemplateMaster.services";

const VALID_STATUSES = ["AC", "IN"];
const ADMIN_ROLES = ["admin", "super admin", "administrator"];

const parseId = (raw: unknown): number | null => {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const authFrom = identityFrom;

export const getAllTripTemplateMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const tripTemplates = await getAllTripTemplateMasterService(status || undefined);
    res.json({ success: true, count: tripTemplates.length, data: tripTemplates });
  } catch (error: any) {
    console.error("GetAllTripTemplateMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getTripTemplateMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "A valid Trip Template ID is required" });
    return;
  }

  try {
    const tripTemplate = await getTripTemplateMasterByIdService(parseInt(id as string, 10));

    if (!tripTemplate) {
      res.status(404).json({ success: false, message: "Trip template not found" });
      return;
    }

    res.json({ success: true, data: tripTemplate });
  } catch (error: any) {
    console.error("GetTripTemplateMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveTripTemplateMaster = async (req: Request, res: Response): Promise<void> => {
  const tripTemplateData: TripTemplateMasterData = req.body;
  if (!tripTemplateData.TRIP_TEMPLATE_NAME) {
    res.status(400).json({ success: false, message: "Trip Template Name is required" });
    return;
  }

  if (tripTemplateData.STATUS_MASTER && !VALID_STATUSES.includes(tripTemplateData.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IN" });
    return;
  }

  try {
    const result = await saveTripTemplateMasterService(tripTemplateData);
    res.json({ success: true, message: result.message || "Trip template saved successfully", TRIP_TEMPLATE_ID: result.TRIP_TEMPLATE_ID });
  } catch (error: any) {
    console.error("SaveTripTemplateMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateTripTemplateMaster = async (req: Request, res: Response): Promise<void> => {
  const tripTemplateData: TripTemplateMasterData = req.body;
  const id = parseId(req.params.id) ?? parseId(String(tripTemplateData.TRIP_TEMPLATE_ID ?? ""));
  if (!id) {
    res.status(400).json({ success: false, message: "A valid Trip Template ID is required" });
    return;
  }

  if (tripTemplateData.STATUS_MASTER && !VALID_STATUSES.includes(tripTemplateData.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IN" });
    return;
  }

  try {
    tripTemplateData.TRIP_TEMPLATE_ID = id;
    const result = await updateTripTemplateMasterService(tripTemplateData);
    res.json({ success: true, message: result.message || "Trip template updated successfully" });
  } catch (error: any) {
    console.error("UpdateTripTemplateMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteTripTemplateMaster = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, message: "A valid Trip Template ID is required" });
    return;
  }

  const { USER, ROLE, MAC_ADDRESS } = authFrom(req);
  const roleLower = (ROLE || "").toLowerCase();
  if (ROLE && !ADMIN_ROLES.includes(roleLower)) {
    res.status(403).json({ success: false, message: "NO RIGHTS TO DELETE" });
    return;
  }

  try {
    const result = await deleteTripTemplateMasterService(id, USER, ROLE, MAC_ADDRESS);
    res.json({ success: true, message: result.message || "Trip template deleted successfully" });
  } catch (error: any) {
    console.error("DeleteTripTemplateMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
