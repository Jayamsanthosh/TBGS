import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllPaymentTriggerEventMasterService,
  getPaymentTriggerEventMasterByIdService,
  savePaymentTriggerEventMasterService,
  updatePaymentTriggerEventMasterService,
  deletePaymentTriggerEventMasterService,
  PaymentTriggerEventMasterData,
} from "../services/paymentTriggerEventMaster.services";

const parseId = (raw: unknown): number | null => {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const VALID_STATUSES = ["AC", "IA", "ACTIVE", "INACTIVE"];

export const getAllPaymentTriggerEventMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
    const triggerEvents = await getAllPaymentTriggerEventMasterService(status);
    res.json({ success: true, count: triggerEvents.length, data: triggerEvents });
  } catch (error: any) {
    console.error("GetAllPaymentTriggerEventMaster error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPaymentTriggerEventMasterById = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);

  if (!id) {
    res.status(400).json({ success: false, message: "A valid Trigger Event ID is required" });
    return;
  }

  try {
    const rawLinkId = req.query.LINK_ID ?? req.query.link_id;
    const linkId = rawLinkId != null && rawLinkId !== "" ? Number(rawLinkId) : null;
    const triggerEvent = await getPaymentTriggerEventMasterByIdService(id, Number.isFinite(linkId) ? linkId : null);

    if (!triggerEvent) {
      res.status(404).json({ success: false, message: "Trigger event not found" });
      return;
    }

    res.json({ success: true, data: triggerEvent });
  } catch (error: any) {
    console.error("GetPaymentTriggerEventMasterById error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const savePaymentTriggerEventMaster = async (req: Request, res: Response): Promise<void> => {
  const triggerEventData: PaymentTriggerEventMasterData = req.body;

  if (!triggerEventData.TRIGGER_EVENT_CODE?.trim()) {
    res.status(400).json({ success: false, message: "Trigger Event Code is required" });
    return;
  }

  if (!triggerEventData.TRIGGER_EVENT_NAME?.trim()) {
    res.status(400).json({ success: false, message: "Trigger Event Name is required" });
    return;
  }

  if (triggerEventData.STATUS_MASTER && !VALID_STATUSES.includes(triggerEventData.STATUS_MASTER.toUpperCase())) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  const { USER, MAC_ADDRESS } = identityFrom(req);
  triggerEventData.USER = USER || triggerEventData.USER || "Admin";
  triggerEventData.MAC_ADDRESS = MAC_ADDRESS || triggerEventData.MAC_ADDRESS || "WEB";
  if (triggerEventData.LINK_ID === undefined || triggerEventData.LINK_ID === null) {
    triggerEventData.LINK_ID = 45;
  }

  try {
    const result = await savePaymentTriggerEventMasterService(triggerEventData);
    res.json({
      success: true,
      message: result.message || "Data Saved Successfully",
      data: result.TRIGGER_EVENT_ID,
      TRIGGER_EVENT_ID: result.TRIGGER_EVENT_ID,
    });
  } catch (error: any) {
    console.error("SavePaymentTriggerEventMaster error:", error);
    res.status(error?.httpStatus || 400).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updatePaymentTriggerEventMaster = async (req: Request, res: Response): Promise<void> => {
  const triggerEventData: PaymentTriggerEventMasterData = req.body;
  const id = parseId(req.params.id) ?? parseId(triggerEventData.TRIGGER_EVENT_ID);

  if (!id) {
    res.status(400).json({ success: false, message: "A valid Trigger Event ID is required" });
    return;
  }

  if (!triggerEventData.TRIGGER_EVENT_CODE?.trim()) {
    res.status(400).json({ success: false, message: "Trigger Event Code is required" });
    return;
  }

  if (!triggerEventData.TRIGGER_EVENT_NAME?.trim()) {
    res.status(400).json({ success: false, message: "Trigger Event Name is required" });
    return;
  }

  if (triggerEventData.STATUS_MASTER && !VALID_STATUSES.includes(triggerEventData.STATUS_MASTER.toUpperCase())) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  triggerEventData.TRIGGER_EVENT_ID = id;
  const { USER, MAC_ADDRESS } = identityFrom(req);
  triggerEventData.USER = USER || triggerEventData.USER || "Admin";
  triggerEventData.MAC_ADDRESS = MAC_ADDRESS || triggerEventData.MAC_ADDRESS || "WEB";
  if (triggerEventData.LINK_ID === undefined || triggerEventData.LINK_ID === null) {
    triggerEventData.LINK_ID = 45;
  }

  try {
    const result = await updatePaymentTriggerEventMasterService(triggerEventData);
    res.json({
      success: true,
      message: result.message || "RECORD UPDATED SUCCESSFULL",
      data: result.TRIGGER_EVENT_ID,
      TRIGGER_EVENT_ID: result.TRIGGER_EVENT_ID,
    });
  } catch (error: any) {
    console.error("UpdatePaymentTriggerEventMaster error:", error);
    res.status(error?.httpStatus || 400).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deletePaymentTriggerEventMaster = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "A valid Trigger Event ID is required" });
    return;
  }

  try {
    const result = await deletePaymentTriggerEventMasterService(
      id,
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeletePaymentTriggerEventMaster error:", error);
    res.status(error?.httpStatus || 400).json({ success: false, message: error?.message || "Internal server error" });
  }
};
