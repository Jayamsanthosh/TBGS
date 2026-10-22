import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  getPurchaseInvoiceConversationsService,
  getPurchaseInvoiceConversationService,
  getInvoiceConversationResponseStatusesService,
  savePurchaseInvoiceConversationService,
  updatePurchaseInvoiceConversationService,
  deletePurchaseInvoiceConversationService,
  PurchaseInvoiceConversationData,
} from "../services/purchaseInvoiceConversation.services";

/* "No Rights To Delete" is a permission problem, not a bad request. */
const FORBIDDEN = /no rights|denied|unauthori[sz]ed/i;

/* A constraint violation is the caller's fault, not a server fault. */
const CONSTRAINT = /foreign key|constraint/i;

const fail = (res: Response, error: any, fallback: string): void => {
  const message = error?.message || fallback;
  let status = error?.httpStatus || 500;
  if (status === 500 && CONSTRAINT.test(message)) status = 400;
  if (FORBIDDEN.test(message)) status = 403;
  res.status(status).json({ success: false, message });
};

/* The page id is optional on the way in; the service falls back to the
   Purchase Invoice link id when it is not supplied. */
const linkPagesIdOf = (req: Request) => {
  const raw =
    (req.query?.linkPagesId as string) ??
    (req.body?.LINK_PAGES_ID as string | number) ??
    (req.body?.linkPagesId as string | number);
  if (raw === undefined || raw === null || raw === "") return undefined;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : undefined;
};

export const getPurchaseInvoiceConversations = async (req: Request, res: Response): Promise<void> => {
  const { refNo } = req.params;
  const { statusEntry } = req.query;
  try {
    const rows = await getPurchaseInvoiceConversationsService(
      refNo,
      typeof statusEntry === "string" ? statusEntry : undefined,
      linkPagesIdOf(req)
    );
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error: any) {
    console.error("GetPurchaseInvoiceConversations error:", error);
    fail(res, error, "Failed to fetch the conversation");
  }
};

export const getPurchaseInvoiceConversation = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const row = await getPurchaseInvoiceConversationService(id, linkPagesIdOf(req));
    res.json({ success: true, data: row });
  } catch (error: any) {
    console.error("GetPurchaseInvoiceConversation error:", error);
    fail(res, error, "Failed to fetch the conversation");
  }
};

export const getInvoiceConversationResponseStatuses = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await getInvoiceConversationResponseStatusesService(linkPagesIdOf(req));
    res.json({ success: true, count: data.length, data });
  } catch (error: any) {
    console.error("GetInvoiceConversationResponseStatuses error:", error);
    fail(res, error, "Failed to fetch response statuses");
  }
};

export const savePurchaseInvoiceConversation = async (req: Request, res: Response): Promise<void> => {
  const body = (req.body ?? {}) as PurchaseInvoiceConversationData;
  /* Identity comes from the session, never from the request body. */
  const { USER, MAC_ADDRESS } = identityFrom(req);
  try {
    const result = await savePurchaseInvoiceConversationService({
      ...body,
      LINK_PAGES_ID: linkPagesIdOf(req) ?? body.LINK_PAGES_ID,
      USER,
      MAC_ADDRESS,
    });
    res.status(201).json({
      success: true,
      CONVERSATION_ID: result.CONVERSATION_ID,
      message: result.message || "Conversation saved successfully",
    });
  } catch (error: any) {
    console.error("SavePurchaseInvoiceConversation error:", error);
    fail(res, error, "Failed to save the conversation");
  }
};

export const updatePurchaseInvoiceConversation = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const body = (req.body ?? {}) as PurchaseInvoiceConversationData;
  const { USER, MAC_ADDRESS } = identityFrom(req);
  try {
    const result = await updatePurchaseInvoiceConversationService(id, {
      ...body,
      LINK_PAGES_ID: linkPagesIdOf(req) ?? body.LINK_PAGES_ID,
      USER,
      MAC_ADDRESS,
    });
    res.json({
      success: true,
      CONVERSATION_ID: result.CONVERSATION_ID,
      message: result.message || "Conversation updated successfully",
    });
  } catch (error: any) {
    console.error("UpdatePurchaseInvoiceConversation error:", error);
    fail(res, error, "Failed to update the conversation");
  }
};

export const deletePurchaseInvoiceConversation = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await deletePurchaseInvoiceConversationService(
      id,
      identityFrom(req),
      linkPagesIdOf(req)
    );
    res.json({
      success: true,
      CONVERSATION_ID: result.CONVERSATION_ID,
      message: result.message || "Conversation deleted successfully",
    });
  } catch (error: any) {
    console.error("DeletePurchaseInvoiceConversation error:", error);
    fail(res, error, "Failed to delete the conversation");
  }
};
