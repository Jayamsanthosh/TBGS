import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  getAllSubMenuMappingService,
  getSubMenuMappingByIdService,
  saveSubMenuMappingService,
  updateSubMenuMappingService,
  deleteSubMenuMappingService,
  SubMenuMappingData,
} from "../services/subMenuMapping.services";

const LIMITS = {
  MAP_LOCATION: 100,
} as const;

const validatePayload = (data: SubMenuMappingData): string | null => {
  if (data.MAP_LOCATION && String(data.MAP_LOCATION).trim().length > LIMITS.MAP_LOCATION) {
    return `Map Location must be ${LIMITS.MAP_LOCATION} characters or less`;
  }
  return null;
};

const normalizePayload = (payload: SubMenuMappingData) => {
  if (typeof payload.MAP_LOCATION === "string") {
    payload.MAP_LOCATION = payload.MAP_LOCATION.trim() || null;
  }
  const status = String(payload.STATUS_MASTER ?? "").trim().toUpperCase();
  payload.STATUS_MASTER =
    status === "INACTIVE" || status === "IA" || status === "IN" ? "IA" : "AC";
  return payload;
};

export const getAllSubMenuMapping = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
    const records = await getAllSubMenuMappingService(status);
    res.json({ success: true, count: records.length, data: records });
  } catch (error: any) {
    console.error("GetAllSubMenuMapping error:", error);
    res.status(error?.httpStatus || 500).json({
      success: false,
      message: error?.message || "Internal server error",
    });
  }
};

export const getSubMenuMappingById = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);

  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ success: false, message: "Mapping ID is required" });
    return;
  }

  try {
    const record = await getSubMenuMappingByIdService(id);

    if (!record) {
      res.status(404).json({ success: false, message: "Sub menu mapping not found" });
      return;
    }

    res.json({ success: true, data: record });
  } catch (error: any) {
    console.error("GetSubMenuMappingById error:", error);
    res.status(error?.httpStatus || 500).json({
      success: false,
      message: error?.message || "Internal server error",
    });
  }
};

export const saveSubMenuMapping = async (req: Request, res: Response): Promise<void> => {
  const payload: SubMenuMappingData = req.body;
  const { USER, MAC_ADDRESS } = identityFrom(req);
  payload.USER = USER;
  payload.MAC_ADDRESS = MAC_ADDRESS;

  const validationError = validatePayload(payload);
  if (validationError) {
    res.status(400).json({ success: false, message: validationError });
    return;
  }

  normalizePayload(payload);

  try {
    const result = await saveSubMenuMappingService(payload);
    res.json({
      success: true,
      message: result.message || "Sub menu mapping saved successfully",
      MAP_ID: result.MAP_ID,
    });
  } catch (error: any) {
    console.error("SaveSubMenuMapping error:", error);
    res.status(error?.httpStatus || 500).json({
      success: false,
      message: error?.message || "Internal server error",
    });
  }
};

export const updateSubMenuMapping = async (req: Request, res: Response): Promise<void> => {
  const payload: SubMenuMappingData = req.body;
  const { USER, MAC_ADDRESS } = identityFrom(req);
  payload.USER = USER;
  payload.MAC_ADDRESS = MAC_ADDRESS;
  const { id } = req.params;

  if (!payload.MAP_ID && id) {
    payload.MAP_ID = parseInt(id as string, 10);
  }

  if (!payload.MAP_ID || !Number.isFinite(Number(payload.MAP_ID))) {
    res.status(400).json({ success: false, message: "Mapping ID is required" });
    return;
  }

  const validationError = validatePayload(payload);
  if (validationError) {
    res.status(400).json({ success: false, message: validationError });
    return;
  }

  normalizePayload(payload);

  try {
    const result = await updateSubMenuMappingService(payload);
    res.json({
      success: true,
      message: result.message || "Sub menu mapping updated successfully",
    });
  } catch (error: any) {
    console.error("UpdateSubMenuMapping error:", error);
    res.status(error?.httpStatus || 500).json({
      success: false,
      message: error?.message || "Internal server error",
    });
  }
};

export const deleteSubMenuMapping = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);

  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ success: false, message: "Mapping ID is required" });
    return;
  }

  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  try {
    const result = await deleteSubMenuMappingService(id, USER, ROLE, MAC_ADDRESS);
    res.json({
      success: true,
      message: result.message || "Sub menu mapping deleted successfully",
    });
  } catch (error: any) {
    console.error("DeleteSubMenuMapping error:", error);
    res.status(error?.httpStatus || 500).json({
      success: false,
      message: error?.message || "Internal server error",
    });
  }
};
