import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getFilesBySettingService,
  getFileByIdService,
  saveFileService,
  updateFileService,
  deleteFileService,
  BpProductVatFileData
} from "../services/bpProductVatPercentageSettingsFiles.services";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

const parseId = (raw: unknown): number | null => {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const authFrom = identityFrom;

const isAdminRole = (role: string): boolean => {
  const roleLower = role.toLowerCase();
  return ["admin", "super admin", "administrator"].includes(roleLower);
};

const exceedsFileLimit = (data: BpProductVatFileData["CONTENT_DATA"]): boolean => {
  if (typeof data === "string" && data !== "") {
    return Math.floor(data.length * 3) / 4 > MAX_FILE_BYTES;
  }
  if (Buffer.isBuffer(data)) {
    return data.length > MAX_FILE_BYTES;
  }
  return false;
};

export const getFilesBySetting = async (req: Request, res: Response): Promise<void> => {
  const settingId = parseId(req.query.settingId as string);
  if (!settingId) {
    res.status(400).json({ success: false, message: "A valid settingId query param is required" });
    return;
  }
  try {
    const status = req.query.status as string | undefined;
    const files = await getFilesBySettingService(settingId, status || undefined);
    res.json({ success: true, count: files.length, data: files });
  } catch (error: any) {
    console.error("GetFilesBySetting error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getFileById = async (req: Request, res: Response): Promise<void> => {
  const sno = parseId(req.params.sno);
  if (!sno) {
    res.status(400).json({ success: false, message: "A valid SNO is required" });
    return;
  }
  try {
    const file = await getFileByIdService(sno);
    if (!file) {
      res.status(404).json({ success: false, message: "File not found" });
      return;
    }
    res.json({ success: true, data: file });
  } catch (error: any) {
    console.error("GetFileById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveFile = async (req: Request, res: Response): Promise<void> => {
  const fileData: BpProductVatFileData = req.body;
  if (!parseId(String(fileData.BP_PROD_VAT_ID ?? ""))) {
    res.status(400).json({ success: false, message: "A valid BP_PROD_VAT_ID is required" });
    return;
  }
  if (!fileData.FILE_NAME) {
    res.status(400).json({ success: false, message: "FILE_NAME is required" });
    return;
  }
  if (exceedsFileLimit(fileData.CONTENT_DATA)) {
    res.status(413).json({ success: false, message: "File exceeds the 10 MB upload limit" });
    return;
  }
  try {
    const result = await saveFileService(fileData);
    res.json({ success: true, message: result.message || "File uploaded successfully", SNO: result.SNO });
  } catch (error: any) {
    console.error("SaveFile error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateFile = async (req: Request, res: Response): Promise<void> => {
  const fileData: BpProductVatFileData = req.body;
  const sno = parseId(req.params.sno) ?? parseId(String(fileData.SNO ?? ""));
  if (!sno) {
    res.status(400).json({ success: false, message: "A valid SNO is required" });
    return;
  }
  if (exceedsFileLimit(fileData.CONTENT_DATA)) {
    res.status(413).json({ success: false, message: "File exceeds the 10 MB upload limit" });
    return;
  }
  try {
    fileData.SNO = sno;
    const result = await updateFileService(fileData);
    res.json({ success: true, message: result.message || "File updated successfully" });
  } catch (error: any) {
    console.error("UpdateFile error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteFile = async (req: Request, res: Response): Promise<void> => {
  const sno = parseId(req.params.sno);
  if (!sno) {
    res.status(400).json({ success: false, message: "A valid SNO is required" });
    return;
  }
  const { USER, ROLE, MAC_ADDRESS } = authFrom(req);
  if (ROLE && !isAdminRole(ROLE)) {
    res.status(403).json({ success: false, message: "NO RIGHTS TO DELETE" });
    return;
  }
  try {
    const spRole = ROLE && isAdminRole(ROLE) ? "Admin" : ROLE || "Manager";
    const result = await deleteFileService(sno, USER, spRole, MAC_ADDRESS);
    res.json({ success: true, message: result.message || "File deleted successfully" });
  } catch (error: any) {
    console.error("DeleteFile error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
