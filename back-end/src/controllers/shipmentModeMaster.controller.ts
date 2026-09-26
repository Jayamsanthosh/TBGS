import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  saveShipmentModeMasterService,
  updateShipmentModeMasterService,
  deleteShipmentModeMasterService,
  getShipmentModeMasterListService,
  getShipmentModeMasterByIdService,
  loadShipmentModeMasterOptionsService,
  ShipmentModeMasterData
} from "../services/shipmentModeMaster.services";

export const getAllShipmentModeMaster = async (req: Request, res: Response): Promise<void> => {
  const status = (req.query.status as string) || "ALL";
  const search = (req.query.search as string) || "";
  const page = req.query.page != null && req.query.page !== "" ? Number(req.query.page) : null;
  const pageSize =
    req.query.pageSize != null && req.query.pageSize !== "" ? Number(req.query.pageSize) : null;

  try {
    const result = await getShipmentModeMasterListService({ status, search, page, pageSize });
    res.json({ success: true, total: result.total, count: result.rows.length, data: result.rows });
  } catch (error: any) {
    console.error("GetAllShipmentModeMaster error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getShipmentModeMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const idNumber = parseInt(id as string, 10);
  if (!id || Number.isNaN(idNumber) || idNumber <= 0) {
    res.status(400).json({ success: false, message: "Shipment Mode ID must be a valid positive integer" });
    return;
  }

  try {
    const shipmentModeRow = await getShipmentModeMasterByIdService(idNumber);

    if (!shipmentModeRow) {
      res.status(404).json({ success: false, message: "Shipment Mode not found" });
      return;
    }

    res.json({ success: true, data: shipmentModeRow });
  } catch (error: any) {
    console.error("GetShipmentModeMasterById error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getShipmentModeMasterLoad = async (req: Request, res: Response): Promise<void> => {
  const includeInactive = req.query.includeInactive === "true" || req.query.includeInactive === "1";

  try {
    const options = await loadShipmentModeMasterOptionsService(includeInactive);
    res.json({ success: true, count: options.length, data: options });
  } catch (error: any) {
    console.error("GetShipmentModeMasterLoad error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveShipmentModeMaster = async (req: Request, res: Response): Promise<void> => {
  const shipmentModeData: ShipmentModeMasterData = req.body;

  if (!shipmentModeData.SHIPMENT_MODE_NAME) {
    res.status(400).json({ success: false, message: "Shipment Mode Name is required" });
    return;
  }

  try {
    const result = await saveShipmentModeMasterService(shipmentModeData);
    res.json({
      success: true,
      message: result.message || "Shipment Mode saved successfully",
      SHIPMENT_MODE_ID: result.id
    });
  } catch (error: any) {
    console.error("SaveShipmentModeMaster error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateShipmentModeMaster = async (req: Request, res: Response): Promise<void> => {
  const shipmentModeData: ShipmentModeMasterData = req.body;
  const { id } = req.params;

  if (!shipmentModeData.SHIPMENT_MODE_ID && id) {
    const idNumber = parseInt(id as string, 10);
    if (!Number.isNaN(idNumber) && idNumber > 0) shipmentModeData.SHIPMENT_MODE_ID = idNumber;
  }

  if (!shipmentModeData.SHIPMENT_MODE_ID) {
    res.status(400).json({ success: false, message: "Shipment Mode ID is required" });
    return;
  }

  if (!shipmentModeData.SHIPMENT_MODE_NAME) {
    res.status(400).json({ success: false, message: "Shipment Mode Name is required" });
    return;
  }

  try {
    const result = await updateShipmentModeMasterService(shipmentModeData);
    res.json({ success: true, message: result.message || "Shipment Mode updated successfully" });
  } catch (error: any) {
    console.error("UpdateShipmentModeMaster error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteShipmentModeMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  const idNumber = parseInt(id as string, 10);
  if (!id || Number.isNaN(idNumber) || idNumber <= 0) {
    res.status(400).json({ success: false, message: "Shipment Mode ID must be a valid positive integer" });
    return;
  }

  try {
    const result = await deleteShipmentModeMasterService(
      idNumber,
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({
      success: true,
      message: result.message || "Shipment Mode deleted successfully",
      SHIPMENT_MODE_ID: idNumber
    });
  } catch (error: any) {
    console.error("DeleteShipmentModeMaster error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};