import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllPriceListMasterService,
  getPriceListMasterByIdService,
  savePriceListMasterService,
  updatePriceListMasterService,
  deletePriceListMasterService,
  PriceListMasterData
} from "../services/priceListMaster.services";

const parseId = (raw: unknown): number | null => {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
};

export const getAllPriceListMaster = async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await getAllPriceListMasterService();
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllPriceListMaster error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPriceListMasterById = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);

  if (!id) {
    res.status(400).json({ success: false, message: "A valid Price List ID is required" });
    return;
  }

  try {
    const rawLinkId = req.query.LINK_ID ?? req.query.link_id;
    const linkId = rawLinkId != null && rawLinkId !== "" ? Number(rawLinkId) : null;
    const item = await getPriceListMasterByIdService(id, Number.isFinite(linkId) ? linkId : null);

    if (!item) {
      res.status(404).json({ success: false, message: "Price list not found" });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetPriceListMasterById error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const savePriceListMaster = async (req: Request, res: Response): Promise<void> => {
  const data: PriceListMasterData = req.body;

  if (data.PRICE_TYPE_ID === undefined || data.COMPANY_ID === undefined) {
    res.status(400).json({ success: false, message: "Price Type and Company are required" });
    return;
  }

  const { USER, MAC_ADDRESS } = identityFrom(req);
  data.USER = USER || data.USER || "Admin";
  data.MAC_ADDRESS = MAC_ADDRESS || data.MAC_ADDRESS || "WEB";
  if (data.LINK_ID === undefined || data.LINK_ID === null) {
    data.LINK_ID = 105;
  }

  try {
    const result = await savePriceListMasterService(data);
    res.json({
      success: true,
      message: result.message || "Price list saved successfully",
      PRICE_LIST_ID: result.PRICE_LIST_ID,
    });
  } catch (error: any) {
    console.error("SavePriceListMaster error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updatePriceListMaster = async (req: Request, res: Response): Promise<void> => {
  const data: PriceListMasterData = req.body;
  const id = parseId(req.params.id) ?? parseId(data.PRICE_LIST_ID);

  if (!id) {
    res.status(400).json({ success: false, message: "A valid Price List ID is required" });
    return;
  }

  if (data.PRICE_TYPE_ID === undefined || data.COMPANY_ID === undefined) {
    res.status(400).json({ success: false, message: "Price Type and Company are required" });
    return;
  }

  data.PRICE_LIST_ID = id;
  const { USER, MAC_ADDRESS } = identityFrom(req);
  data.USER = USER || data.USER || "Admin";
  data.MAC_ADDRESS = MAC_ADDRESS || data.MAC_ADDRESS || "WEB";
  if (data.LINK_ID === undefined || data.LINK_ID === null) {
    data.LINK_ID = 105;
  }

  try {
    const result = await updatePriceListMasterService(data);
    res.json({
      success: true,
      message: result.message || "Price list updated successfully",
      PRICE_LIST_ID: result.PRICE_LIST_ID,
    });
  } catch (error: any) {
    console.error("UpdatePriceListMaster error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deletePriceListMaster = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "A valid Price List ID is required" });
    return;
  }

  try {
    const result = await deletePriceListMasterService(
      id,
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Price list deleted successfully" });
  } catch (error: any) {
    console.error("DeletePriceListMaster error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
