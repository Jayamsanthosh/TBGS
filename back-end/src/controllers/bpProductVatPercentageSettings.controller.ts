import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllService,
  getByIdService,
  saveService,
  updateService,
  deleteService,
  submitService,
  BpProductVatData
} from "../services/bpProductVatPercentageSettings.services";

const parseId = (raw: unknown): number | null => {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const authFrom = identityFrom;

const validatePayload = (data: BpProductVatData): string | null => {
  if (!parseId(String(data.COMPANY_ID ?? ""))) return "Company is required";
  if (!parseId(String(data.BP_ID ?? ""))) return "Business Partner is required";
  if (!parseId(String(data.MAIN_CATEGORY_ID ?? ""))) return "Main Category is required";
  if (!parseId(String(data.SUB_CATEGORY_ID ?? ""))) return "Sub Category is required";
  if (!parseId(String(data.PRODUCT_ID ?? ""))) return "Product is required";
  if (data.VAT_PERCENTAGE === undefined || data.VAT_PERCENTAGE === null || data.VAT_PERCENTAGE === "") {
    return "VAT Percentage is required";
  }
  return null;
};

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const rows = await getAllService(status || undefined);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error: any) {
    console.error("GetAll error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, message: "A valid ID is required" });
    return;
  }
  try {
    const row = await getByIdService(id);
    if (!row) {
      res.status(404).json({ success: false, message: "Record not found" });
      return;
    }
    res.json({ success: true, data: row });
  } catch (error: any) {
    console.error("GetById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const save = async (req: Request, res: Response): Promise<void> => {
  const data: BpProductVatData = req.body;
  const validation = validatePayload(data);
  if (validation) {
    res.status(400).json({ success: false, message: validation });
    return;
  }
  try {
    const result = await saveService(data);
    res.json({ success: true, message: result.message, BP_PROD_VAT_ID: result.BP_PROD_VAT_ID });
  } catch (error: any) {
    console.error("Save error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  const data: BpProductVatData = req.body;
  const id = parseId(req.params.id) ?? parseId(String(data.BP_PROD_VAT_ID ?? ""));
  if (!id) {
    res.status(400).json({ success: false, message: "A valid ID is required" });
    return;
  }
  const validation = validatePayload(data);
  if (validation) {
    res.status(400).json({ success: false, message: validation });
    return;
  }
  try {
    data.BP_PROD_VAT_ID = id;
    const result = await updateService(data);
    res.json({ success: true, message: result.message });
  } catch (error: any) {
    console.error("Update error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteRecord = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, message: "A valid ID is required" });
    return;
  }
  const { USER, ROLE, MAC_ADDRESS } = authFrom(req);
  const roleLower = ((ROLE as string) || "").toLowerCase();
  if (ROLE && roleLower !== "admin") {
    res.status(403).json({ success: false, message: "NO RIGHTS TO DELETE" });
    return;
  }
  try {
    const result = await deleteService(id, USER, ROLE, MAC_ADDRESS);
    res.json({ success: true, message: result.message });
  } catch (error: any) {
    console.error("Delete error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const submit = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, message: "A valid ID is required" });
    return;
  }
  const { ROLE } = authFrom(req);
  try {
    const result = await submitService(id, ROLE || "Administrator");
    res.json({ success: true, message: result.message, STATUS_MASTER: result.STATUS_MASTER });
  } catch (error: any) {
    console.error("Submit error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
