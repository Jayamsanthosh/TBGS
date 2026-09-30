import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  getAllDocumentsService,
  getDocumentTypesService,
  getDocumentByIdService,
  saveDocumentService,
  updateDocumentService,
  deleteDocumentService,
} from "../services/dms.services";

/* Mirrors the rest of the module surface: a validation or permission problem the
   stored procedure reported is a 4xx, not a server fault. */
const fail = (res: Response, error: any, fallback: string) =>
  res.status((error as any)?.httpStatus || 500).json({ success: false, message: error?.message || fallback });

const parseId = (raw: any): number | null => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const getAllDocuments = async (req: Request, res: Response): Promise<void> => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const rawLink = req.query.linkPagesId;
  const linkPagesId = rawLink !== undefined && String(rawLink) !== "" ? Number(rawLink) : undefined;
  const pageRefNo = typeof req.query.pageRefNo === "string" ? req.query.pageRefNo : undefined;

  if (linkPagesId !== undefined && Number.isNaN(linkPagesId)) {
    res.status(400).json({ success: false, message: "Link page ID must be a number" });
    return;
  }

  try {
    const data = await getAllDocumentsService(status, linkPagesId, pageRefNo);
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error: any) {
    fail(res, error, "Internal server error");
  }
};

export const getDocumentTypes = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await getDocumentTypesService();
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    fail(res, error, "Failed to fetch document types");
  }
};

export const getDocumentById = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ success: false, message: "A valid document ID is required" });
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
    fail(res, error, "Internal server error");
  }
};

export const saveDocument = async (req: Request, res: Response): Promise<void> => {
  const { USER, MAC_ADDRESS } = identityFrom(req);
  try {
    const result = await saveDocumentService({ ...req.body, USER, MAC_ADDRESS });
    res.status(201).json({ success: true, message: result.message, DMS_ID: result.DMS_ID });
  } catch (error: any) {
    fail(res, error, "Internal server error");
  }
};

export const updateDocument = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ success: false, message: "A valid document ID is required" });
    return;
  }
  const { USER, MAC_ADDRESS } = identityFrom(req);
  try {
    const result = await updateDocumentService({ ...req.body, DMS_ID: id, USER, MAC_ADDRESS });
    res.status(200).json({ success: true, message: result.message, DMS_ID: result.DMS_ID });
  } catch (error: any) {
    fail(res, error, "Internal server error");
  }
};

export const deleteDocument = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ success: false, message: "A valid document ID is required" });
    return;
  }

  /* The stored procedure is the authoritative gate: it refuses anything that is
     not exactly 'Admin', and its guard is now ISNULL-based so an absent role
     fails the check rather than falling through to the delete.

     The session token only carries a numeric roleId, so identityFrom cannot
     always resolve a role name. When it can, the request is refused here for a
     clearer response; when it cannot, the real role is forwarded unchanged
     rather than defaulted, and the procedure decides. Defaulting it to a
     permitted role would hand delete rights to every caller. */
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);
  const allowedRoles = ["admin", "super admin", "administrator"];
  if (ROLE && !allowedRoles.includes(ROLE.toLowerCase())) {
    res.status(403).json({ success: false, message: "NO RIGHTS TO DELETE" });
    return;
  }

  try {
    const result = await deleteDocumentService(id, USER, ROLE, MAC_ADDRESS);
    res.status(200).json({ success: true, message: result.message, DMS_ID: result.DMS_ID });
  } catch (error: any) {
    fail(res, error, "Internal server error");
  }
};
