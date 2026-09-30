import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  getPurchaseQuotationConversationsService,
  getPurchaseQuotationConversationService,
  getConversationResponseStatusesService,
  savePurchaseQuotationConversationService,
  updatePurchaseQuotationConversationService,
  deletePurchaseQuotationConversationService,
  PurchaseQuotationConversationData,
} from "../services/purchaseQuotationConversation.services";

/* "No Rights To Delete" is a permission problem, not a bad request. */
const FORBIDDEN = /no rights|denied|unauthori[sz]ed/i;

const fail = (res: Response, error: any, fallback: string): void => {
  const message = error?.message || fallback;
  const status = FORBIDDEN.test(message) ? 403 : error?.httpStatus || 500;
  res.status(status).json({ success: false, message });
};

export const getPurchaseQuotationConversations = async (req: Request, res: Response): Promise<void> => {
  const { refNo } = req.params;
  const { statusEntry } = req.query;
  try {
    const rows = await getPurchaseQuotationConversationsService(
      refNo,
      typeof statusEntry === "string" ? statusEntry : undefined
    );
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error: any) {
    console.error("GetPurchaseQuotationConversations error:", error);
    fail(res, error, "Failed to fetch the conversation");
  }
};

export const getPurchaseQuotationConversation = async (req: Request, res: Response): Promise<void> => {
  const { sno } = req.params;
  try {
    const row = await getPurchaseQuotationConversationService(sno);
    if (!row) {
      res.status(404).json({ success: false, message: "Purchase Quotation Conversation not found" });
      return;
    }
    res.json({ success: true, data: row });
  } catch (error: any) {
    console.error("GetPurchaseQuotationConversation error:", error);
    fail(res, error, "Failed to fetch the conversation");
  }
};

export const getConversationResponseStatuses = async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await getConversationResponseStatusesService();
    res.json({ success: true, count: data.length, data });
  } catch (error: any) {
    console.error("GetConversationResponseStatuses error:", error);
    fail(res, error, "Failed to fetch response statuses");
  }
};

export const savePurchaseQuotationConversation = async (req: Request, res: Response): Promise<void> => {
  const body = (req.body ?? {}) as PurchaseQuotationConversationData;
  /* Identity comes from the session, never from the request body. */
  const { USER, MAC_ADDRESS } = identityFrom(req);
  try {
    const result = await savePurchaseQuotationConversationService({
      ...body,
      USER,
      MAC_ADDRESS,
    });
    res.status(201).json({
      success: true,
      SNO: result.SNO,
      message: result.message || "Conversation saved successfully",
    });
  } catch (error: any) {
    console.error("SavePurchaseQuotationConversation error:", error);
    fail(res, error, "Failed to save the conversation");
  }
};

export const updatePurchaseQuotationConversation = async (req: Request, res: Response): Promise<void> => {
  const { sno } = req.params;
  const body = (req.body ?? {}) as PurchaseQuotationConversationData;
  const { USER, MAC_ADDRESS } = identityFrom(req);
  try {
    const result = await updatePurchaseQuotationConversationService(sno, {
      ...body,
      USER,
      MAC_ADDRESS,
    });
    res.json({ success: true, SNO: result.SNO, message: result.message || "Conversation updated successfully" });
  } catch (error: any) {
    console.error("UpdatePurchaseQuotationConversation error:", error);
    fail(res, error, "Failed to update the conversation");
  }
};

export const deletePurchaseQuotationConversation = async (req: Request, res: Response): Promise<void> => {
  const { sno } = req.params;
  try {
    const result = await deletePurchaseQuotationConversationService(sno, identityFrom(req));
    res.json({ success: true, SNO: result.SNO, message: result.message || "Conversation deleted successfully" });
  } catch (error: any) {
    console.error("DeletePurchaseQuotationConversation error:", error);
    fail(res, error, "Failed to delete the conversation");
  }
};
