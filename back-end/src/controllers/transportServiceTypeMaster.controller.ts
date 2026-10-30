import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  getAllTransportServiceTypeMasterService,
  getTransportServiceTypeMasterByIdService,
  saveTransportServiceTypeMasterService,
  updateTransportServiceTypeMasterService,
  deleteTransportServiceTypeMasterService,
  toTransportServiceTypeLinkId,
  TransportServiceTypeMasterData,
} from "../services/transportServiceTypeMaster.services";

const LIMITS = {
  TRANSPORT_SERVICE_TYPE_NAME: 100,
  DESCRIPTION: 500,
  REMARKS: 100,
} as const;

const linkIdFrom = (req: Request, body?: TransportServiceTypeMasterData): number => {
  const fromBody = body?.LINK_ID as unknown;
  if (fromBody !== undefined && fromBody !== null && fromBody !== "") {
    return toTransportServiceTypeLinkId(fromBody);
  }
  const fromQuery =
    (req.query.link_id as string) ?? (req.query.linkId as string) ?? (req.body?.LINK_ID as string);
  return toTransportServiceTypeLinkId(fromQuery);
};

const validatePayload = (data: TransportServiceTypeMasterData): string | null => {
  if (!data.TRANSPORT_SERVICE_TYPE_NAME || !String(data.TRANSPORT_SERVICE_TYPE_NAME).trim()) {
    return "Transport Service Type Name is required";
  }
  if (String(data.TRANSPORT_SERVICE_TYPE_NAME).trim().length > LIMITS.TRANSPORT_SERVICE_TYPE_NAME) {
    return `Transport Service Type Name must be ${LIMITS.TRANSPORT_SERVICE_TYPE_NAME} characters or less`;
  }
  if (data.DESCRIPTION && String(data.DESCRIPTION).trim().length > LIMITS.DESCRIPTION) {
    return `Description must be ${LIMITS.DESCRIPTION} characters or less`;
  }
  if (data.REMARKS && String(data.REMARKS).trim().length > LIMITS.REMARKS) {
    return `Remarks must be ${LIMITS.REMARKS} characters or less`;
  }
  return null;
};

export const getAllTransportServiceTypeMaster = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
    const records = await getAllTransportServiceTypeMasterService(status);
    res.json({ success: true, count: records.length, data: records });
  } catch (error: any) {
    console.error("GetAllTransportServiceTypeMaster error:", error);
    res.status(error?.httpStatus || 500).json({
      success: false,
      message: error?.message || "Internal server error",
    });
  }
};

export const getTransportServiceTypeMasterById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);

  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ success: false, message: "Transport Service Type ID is required" });
    return;
  }

  try {
    const record = await getTransportServiceTypeMasterByIdService(id);

    if (!record) {
      res.status(404).json({ success: false, message: "Transport service type not found" });
      return;
    }

    res.json({ success: true, data: record });
  } catch (error: any) {
    console.error("GetTransportServiceTypeMasterById error:", error);
    res.status(error?.httpStatus || 500).json({
      success: false,
      message: error?.message || "Internal server error",
    });
  }
};

export const saveTransportServiceTypeMaster = async (
  req: Request,
  res: Response
): Promise<void> => {
  const payload: TransportServiceTypeMasterData = req.body;

  const validationError = validatePayload(payload);
  if (validationError) {
    res.status(400).json({ success: false, message: validationError });
    return;
  }

  payload.TRANSPORT_SERVICE_TYPE_NAME = payload.TRANSPORT_SERVICE_TYPE_NAME.trim();
  payload.LINK_ID = linkIdFrom(req, payload);

  try {
    const result = await saveTransportServiceTypeMasterService(payload);
    res.json({
      success: true,
      message: result.message || "Transport service type saved successfully",
      TRANSPORT_SERVICE_TYPE_ID: result.TRANSPORT_SERVICE_TYPE_ID,
    });
  } catch (error: any) {
    console.error("SaveTransportServiceTypeMaster error:", error);
    res.status(error?.httpStatus || 500).json({
      success: false,
      message: error?.message || "Internal server error",
    });
  }
};

export const updateTransportServiceTypeMaster = async (
  req: Request,
  res: Response
): Promise<void> => {
  const payload: TransportServiceTypeMasterData = req.body;
  const { id } = req.params;

  if (!payload.TRANSPORT_SERVICE_TYPE_ID && id) {
    payload.TRANSPORT_SERVICE_TYPE_ID = parseInt(id as string, 10);
  }

  if (!payload.TRANSPORT_SERVICE_TYPE_ID || !Number.isFinite(Number(payload.TRANSPORT_SERVICE_TYPE_ID))) {
    res.status(400).json({ success: false, message: "Transport Service Type ID is required" });
    return;
  }

  const validationError = validatePayload(payload);
  if (validationError) {
    res.status(400).json({ success: false, message: validationError });
    return;
  }

  payload.TRANSPORT_SERVICE_TYPE_NAME = payload.TRANSPORT_SERVICE_TYPE_NAME.trim();
  payload.LINK_ID = linkIdFrom(req, payload);

  try {
    const result = await updateTransportServiceTypeMasterService(payload);
    res.json({
      success: true,
      message: result.message || "Transport service type updated successfully",
    });
  } catch (error: any) {
    console.error("UpdateTransportServiceTypeMaster error:", error);
    res.status(error?.httpStatus || 500).json({
      success: false,
      message: error?.message || "Internal server error",
    });
  }
};

export const deleteTransportServiceTypeMaster = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);

  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ success: false, message: "Transport Service Type ID is required" });
    return;
  }

  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  try {
    const result = await deleteTransportServiceTypeMasterService(id, USER, ROLE, MAC_ADDRESS);
    res.json({
      success: true,
      message: result.message || "Transport service type deleted successfully",
    });
  } catch (error: any) {
    console.error("DeleteTransportServiceTypeMaster error:", error);
    res.status(error?.httpStatus || 500).json({
      success: false,
      message: error?.message || "Internal server error",
    });
  }
};
