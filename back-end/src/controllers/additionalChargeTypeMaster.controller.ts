import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  saveAdditionalChargeTypeService,
  updateAdditionalChargeTypeService,
  deleteAdditionalChargeTypeService,
  getAdditionalChargeTypeListService,
  getAdditionalChargeTypeByIdService,
  loadAdditionalChargeTypeOptionsService,
  AdditionalChargeTypeData
} from "../services/additionalChargeTypeMaster.services";

export const getAllAdditionalChargeType = async (req: Request, res: Response): Promise<void> => {
  const status = (req.query.status as string) || "ALL";
  const search = (req.query.search as string) || "";
  const page = req.query.page != null && req.query.page !== "" ? Number(req.query.page) : null;
  const pageSize =
    req.query.pageSize != null && req.query.pageSize !== "" ? Number(req.query.pageSize) : null;

  try {
    const result = await getAdditionalChargeTypeListService({ status, search, page, pageSize });
    res.json({ success: true, total: result.total, count: result.rows.length, data: result.rows });
  } catch (error: any) {
    console.error("GetAllAdditionalChargeType error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getAdditionalChargeTypeById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const idNumber = parseInt(id as string, 10);
  if (!id || Number.isNaN(idNumber) || idNumber <= 0) {
    res.status(400).json({ success: false, message: "Additional Charge Type ID must be a valid positive integer" });
    return;
  }

  try {
    const chargeType = await getAdditionalChargeTypeByIdService(idNumber);

    if (!chargeType) {
      res.status(404).json({ success: false, message: "Additional Charge Type not found" });
      return;
    }

    res.json({ success: true, data: chargeType });
  } catch (error: any) {
    console.error("GetAdditionalChargeTypeById error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getAdditionalChargeTypeLoad = async (req: Request, res: Response): Promise<void> => {
  const includeInactive = req.query.includeInactive === "true" || req.query.includeInactive === "1";

  try {
    const options = await loadAdditionalChargeTypeOptionsService(includeInactive);
    res.json({ success: true, count: options.length, data: options });
  } catch (error: any) {
    console.error("GetAdditionalChargeTypeLoad error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveAdditionalChargeType = async (req: Request, res: Response): Promise<void> => {
  const chargeTypeData: AdditionalChargeTypeData = req.body;

  if (!chargeTypeData.ADDITIONAL_CHARGE_TYPE_CODE || !String(chargeTypeData.ADDITIONAL_CHARGE_TYPE_CODE).trim()) {
    res.status(400).json({ success: false, message: "Additional Charge Type Code is required" });
    return;
  }

  if (!chargeTypeData.ADDITIONAL_CHARGE_TYPE_NAME || !String(chargeTypeData.ADDITIONAL_CHARGE_TYPE_NAME).trim()) {
    res.status(400).json({ success: false, message: "Additional Charge Type Name is required" });
    return;
  }

  try {
    const result = await saveAdditionalChargeTypeService(chargeTypeData);
    res.json({
      success: true,
      message: result.message || "Additional Charge Type saved successfully",
      ADDITIONAL_CHARGE_TYPE_ID: result.id
    });
  } catch (error: any) {
    console.error("SaveAdditionalChargeType error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateAdditionalChargeType = async (req: Request, res: Response): Promise<void> => {
  const chargeTypeData: AdditionalChargeTypeData = req.body;
  const { id } = req.params;

  if (!chargeTypeData.ADDITIONAL_CHARGE_TYPE_ID && id) {
    const idNumber = parseInt(id as string, 10);
    if (!Number.isNaN(idNumber) && idNumber > 0) chargeTypeData.ADDITIONAL_CHARGE_TYPE_ID = idNumber;
  }

  if (!chargeTypeData.ADDITIONAL_CHARGE_TYPE_ID) {
    res.status(400).json({ success: false, message: "Additional Charge Type ID is required" });
    return;
  }

  if (!chargeTypeData.ADDITIONAL_CHARGE_TYPE_CODE || !String(chargeTypeData.ADDITIONAL_CHARGE_TYPE_CODE).trim()) {
    res.status(400).json({ success: false, message: "Additional Charge Type Code is required" });
    return;
  }

  if (!chargeTypeData.ADDITIONAL_CHARGE_TYPE_NAME || !String(chargeTypeData.ADDITIONAL_CHARGE_TYPE_NAME).trim()) {
    res.status(400).json({ success: false, message: "Additional Charge Type Name is required" });
    return;
  }

  try {
    const result = await updateAdditionalChargeTypeService(chargeTypeData);
    res.json({ success: true, message: result.message || "Additional Charge Type updated successfully" });
  } catch (error: any) {
    console.error("UpdateAdditionalChargeType error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteAdditionalChargeType = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  const idNumber = parseInt(id as string, 10);
  if (!id || Number.isNaN(idNumber) || idNumber <= 0) {
    res.status(400).json({ success: false, message: "Additional Charge Type ID must be a valid positive integer" });
    return;
  }

  try {
    const result = await deleteAdditionalChargeTypeService(
      idNumber,
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({
      success: true,
      message: result.message || "Additional Charge Type deleted successfully",
      ADDITIONAL_CHARGE_TYPE_ID: idNumber
    });
  } catch (error: any) {
    console.error("DeleteAdditionalChargeType error:", error);
    res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
