import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllDocumentsService,
  getDocumentByIdService,
  saveDocumentService,
  updateDocumentService,
  deleteDocumentService
} from "../services/dms.services";

export const getAllDocuments = async (req: Request, res: Response): Promise<void> => {
  const status = req.query.status as string;
  const linkPagesId = req.query.linkPagesId ? Number(req.query.linkPagesId) : undefined;
  const pageRefNo = req.query.pageRefNo as string;
  try {
    const data = await getAllDocumentsService(status, linkPagesId, pageRefNo);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDocumentById = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ success: false, message: "A valid ID is required" });
    return;
  }
  try {
    const item = await getDocumentByIdService(id);
    if (!item) {
      res.status(404).json({ success: false, message: "Document not found" });
      return;
    }
    res.status(200).json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const saveDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await saveDocumentService(req.body);
    res.status(201).json({ success: true, message: result.message, DMS_ID: result.DMS_ID });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDocument = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ success: false, message: "A valid ID is required" });
    return;
  }
  try {
    const result = await updateDocumentService({ ...req.body, DMS_ID: id });
    res.status(200).json({ success: true, message: result.message });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDocument = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ success: false, message: "A valid ID is required" });
    return;
  }
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);
  try {
    const result = await deleteDocumentService(
      id,
      (USER as string) || "Admin",
      (ROLE as string) || "Admin",
      (MAC_ADDRESS as string) || "WEB"
    );
    res.status(200).json({ success: true, message: result.message });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
