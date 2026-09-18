import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllFilesService,
  getFilesByTruckService,
  getFileByIdService,
  saveFileService,
  updateFileService,
  deleteFileService,
  TruckMasterFileData
} from "../services/truckMasterFiles.services";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

const parseId = (raw: unknown): number | null => {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const authFrom = identityFrom;

const exceedsFileLimit = (data: TruckMasterFileData["CONTENT_DATA"]): boolean => {
  if (typeof data === "string" && data !== "") {
    return Math.floor(data.length * 3) / 4 > MAX_FILE_BYTES;
  }
  if (Buffer.isBuffer(data)) {
    return data.length > MAX_FILE_BYTES;
  }
  return false;
};

export const getAllFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const files = await getAllFilesService(status || undefined);
    res.json({ success: true, count: files.length, data: files });
  } catch (error: any) {
    console.error("GetAllFiles error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getFilesByTruck = async (req: Request, res: Response): Promise<void> => {
  const truckId = parseId(req.query.truckId as string);
  if (!truckId) {
    res.status(400).json({ success: false, message: "A valid truckId query param is required" });
    return;
  }
  try {
    const files = await getFilesByTruckService(truckId);
    res.json({ success: true, count: files.length, data: files });
  } catch (error: any) {
    console.error("GetFilesByTruck error:", error);
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
  const fileData: TruckMasterFileData = req.body;
  if (!parseId(String(fileData.TRUCK_ID ?? ""))) {
    res.status(400).json({ success: false, message: "A valid TRUCK_ID is required" });
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
  const fileData: TruckMasterFileData = req.body;
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
  const roleLower = ((ROLE as string) || "").toLowerCase();
  const allowedRoles = ["admin", "super admin", "administrator"];
  if (ROLE && !allowedRoles.includes(roleLower)) {
    res.status(403).json({ success: false, message: "NO RIGHTS TO DELETE" });
    return;
  }
  try {
    const result = await deleteFileService(sno, USER, ROLE, MAC_ADDRESS);
    res.json({ success: true, message: result.message || "File deleted successfully" });
  } catch (error: any) {
    console.error("DeleteFile error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
