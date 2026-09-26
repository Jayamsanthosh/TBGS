import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  savePurchaseRequestTypeService,
  updatePurchaseRequestTypeService,
  deletePurchaseRequestTypeService,
  getPurchaseRequestTypeListService,
  getPurchaseRequestTypeByIdService,
  loadPurchaseRequestTypeOptionsService,
  PurchaseRequestTypeData
} from "../services/purchaseRequestTypeMaster.services";

export const getAllPurchaseRequestType = async (req: Request, res: Response): Promise<void> => {
  const status = (req.query.status as string) || "ALL";
  const search = (req.query.search as string) || "";
  const page = req.query.page != null && req.query.page !== "" ? Number(req.query.page) : null;
  const pageSize =
    req.query.pageSize != null && req.query.pageSize !== "" ? Number(req.query.pageSize) : null;

  try {
    const result = await getPurchaseRequestTypeListService({ status, search, page, pageSize });
    res.json({ success: true, total: result.total, count: result.rows.length, data: result.rows });
  } catch (error: any) {
    console.error("GetAllPurchaseRequestType error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPurchaseRequestTypeById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const idNumber = parseInt(id as string, 10);
  if (!id || Number.isNaN(idNumber) || idNumber <= 0) {
    res.status(400).json({ success: false, message: "Request Type ID must be a valid positive integer" });
    return;
  }

  try {
    const requestType = await getPurchaseRequestTypeByIdService(idNumber);

    if (!requestType) {
      res.status(404).json({ success: false, message: "Purchase Request Type not found" });
      return;
    }

    res.json({ success: true, data: requestType });
  } catch (error: any) {
    console.error("GetPurchaseRequestTypeById error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPurchaseRequestTypeLoad = async (req: Request, res: Response): Promise<void> => {
  const includeInactive = req.query.includeInactive === "true" || req.query.includeInactive === "1";

  try {
    const options = await loadPurchaseRequestTypeOptionsService(includeInactive);
    res.json({ success: true, count: options.length, data: options });
  } catch (error: any) {
    console.error("GetPurchaseRequestTypeLoad error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const savePurchaseRequestType = async (req: Request, res: Response): Promise<void> => {
  const requestTypeData: PurchaseRequestTypeData = req.body;

  if (!requestTypeData.REQUEST_TYPE_CODE) {
    res.status(400).json({ success: false, message: "Request Type Code is required" });
    return;
  }

  if (!requestTypeData.REQUEST_TYPE_NAME) {
    res.status(400).json({ success: false, message: "Request Type Name is required" });
    return;
  }

  try {
    const result = await savePurchaseRequestTypeService(requestTypeData);
    res.json({
      success: true,
      message: result.message || "Purchase Request Type saved successfully",
      REQUEST_TYPE_ID: result.id
    });
  } catch (error: any) {
    console.error("SavePurchaseRequestType error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updatePurchaseRequestType = async (req: Request, res: Response): Promise<void> => {
  const requestTypeData: PurchaseRequestTypeData = req.body;
  const { id } = req.params;

  if (!requestTypeData.REQUEST_TYPE_ID && id) {
    const idNumber = parseInt(id as string, 10);
    if (!Number.isNaN(idNumber) && idNumber > 0) requestTypeData.REQUEST_TYPE_ID = idNumber;
  }

  if (!requestTypeData.REQUEST_TYPE_ID) {
    res.status(400).json({ success: false, message: "Request Type ID is required" });
    return;
  }

  if (!requestTypeData.REQUEST_TYPE_CODE) {
    res.status(400).json({ success: false, message: "Request Type Code is required" });
    return;
  }

  if (!requestTypeData.REQUEST_TYPE_NAME) {
    res.status(400).json({ success: false, message: "Request Type Name is required" });
    return;
  }

  try {
    const result = await updatePurchaseRequestTypeService(requestTypeData);
    res.json({ success: true, message: result.message || "Purchase Request Type updated successfully" });
  } catch (error: any) {
    console.error("UpdatePurchaseRequestType error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deletePurchaseRequestType = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  const idNumber = parseInt(id as string, 10);
  if (!id || Number.isNaN(idNumber) || idNumber <= 0) {
    res.status(400).json({ success: false, message: "Request Type ID must be a valid positive integer" });
    return;
  }

  try {
    const result = await deletePurchaseRequestTypeService(
      idNumber,
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({
      success: true,
      message: result.message || "Purchase Request Type deleted successfully",
      REQUEST_TYPE_ID: idNumber
    });
  } catch (error: any) {
    console.error("DeletePurchaseRequestType error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};