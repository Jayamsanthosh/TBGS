import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllPaymentTriggerEventMasterService,
  getPaymentTriggerEventMasterByIdService,
  savePaymentTriggerEventMasterService,
  updatePaymentTriggerEventMasterService,
  deletePaymentTriggerEventMasterService,
  PaymentTriggerEventMasterData
} from "../services/paymentTriggerEventMaster.services";

export const getAllPaymentTriggerEventMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const triggerEvents = await getAllPaymentTriggerEventMasterService(status || undefined);
    res.json({ success: true, count: triggerEvents.length, data: triggerEvents });
  } catch (error: any) {
    console.error("GetAllPaymentTriggerEventMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPaymentTriggerEventMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Trigger Event ID is required" });
    return;
  }

  try {
    const triggerEvent = await getPaymentTriggerEventMasterByIdService(parseInt(id as string, 10));

    if (!triggerEvent) {
      res.status(404).json({ success: false, message: "Trigger event not found" });
      return;
    }

    res.json({ success: true, data: triggerEvent });
  } catch (error: any) {
    console.error("GetPaymentTriggerEventMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

const VALID_STATUSES = ["AC", "IA"];

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

  if (triggerEventData.STATUS_MASTER && !VALID_STATUSES.includes(triggerEventData.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    const result = await savePaymentTriggerEventMasterService(triggerEventData);
    res.json({ success: true, message: result.message || "Data saved successfully", TRIGGER_EVENT_ID: result.TRIGGER_EVENT_ID });
  } catch (error: any) {
    console.error("SavePaymentTriggerEventMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updatePaymentTriggerEventMaster = async (req: Request, res: Response): Promise<void> => {
  const triggerEventData: PaymentTriggerEventMasterData = req.body;
  const { id } = req.params;

  if (triggerEventData.STATUS_MASTER && !VALID_STATUSES.includes(triggerEventData.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    if (!triggerEventData.TRIGGER_EVENT_ID && id) {
      triggerEventData.TRIGGER_EVENT_ID = parseInt(id as string, 10);
    }

    const result = await updatePaymentTriggerEventMasterService(triggerEventData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdatePaymentTriggerEventMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deletePaymentTriggerEventMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Trigger Event ID is required" });
    return;
  }

  try {
    const result = await deletePaymentTriggerEventMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeletePaymentTriggerEventMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
