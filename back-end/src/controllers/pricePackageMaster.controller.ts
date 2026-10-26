import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllPricePackageMasterService,
  getPricePackageMasterByIdService,
  savePricePackageMasterService,
  updatePricePackageMasterService,
  deletePricePackageMasterService,
  PricePackageMasterData
} from "../services/pricePackageMaster.services";

const parseId = (raw: unknown): number | null => {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
};

export const getAllPricePackageMaster = async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await getAllPricePackageMasterService();
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllPricePackageMaster error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getPricePackageMasterById = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);

  if (!id) {
    res.status(400).json({ success: false, message: "A valid Price Package ID is required" });
    return;
  }

  try {
    const rawLinkId = req.query.LINK_ID ?? req.query.link_id;
    const linkId = rawLinkId != null && rawLinkId !== "" ? Number(rawLinkId) : null;
    const item = await getPricePackageMasterByIdService(id, Number.isFinite(linkId) ? linkId : null);

    if (!item) {
      res.status(404).json({ success: false, message: "Price package not found" });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetPricePackageMasterById error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const savePricePackageMaster = async (req: Request, res: Response): Promise<void> => {
  const data: PricePackageMasterData = req.body;

  if (!data.PRICE_PACKAGE_NAME || !data.PRICE_PACKAGE_NAME.trim()) {
    res.status(400).json({ success: false, message: "Price Package Name is required" });
    return;
  }

  const { USER, MAC_ADDRESS } = identityFrom(req);
  data.USER = USER || data.USER || "Admin";
  data.MAC_ADDRESS = MAC_ADDRESS || data.MAC_ADDRESS || "WEB";
  if (data.LINK_ID === undefined || data.LINK_ID === null) {
    data.LINK_ID = 104;
  }

  try {
    const result = await savePricePackageMasterService(data);
    res.json({
      success: true,
      message: result.message || "Price package saved successfully",
      PRICE_PACKAGE_ID: result.PRICE_PACKAGE_ID,
    });
  } catch (error: any) {
    console.error("SavePricePackageMaster error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updatePricePackageMaster = async (req: Request, res: Response): Promise<void> => {
  const data: PricePackageMasterData = req.body;
  const id = parseId(req.params.id) ?? parseId(data.PRICE_PACKAGE_ID);

  if (!id) {
    res.status(400).json({ success: false, message: "A valid Price Package ID is required" });
    return;
  }

  if (!data.PRICE_PACKAGE_NAME || !data.PRICE_PACKAGE_NAME.trim()) {
    res.status(400).json({ success: false, message: "Price Package Name is required" });
    return;
  }

  data.PRICE_PACKAGE_ID = id;
  const { USER, MAC_ADDRESS } = identityFrom(req);
  data.USER = USER || data.USER || "Admin";
  data.MAC_ADDRESS = MAC_ADDRESS || data.MAC_ADDRESS || "WEB";
  if (data.LINK_ID === undefined || data.LINK_ID === null) {
    data.LINK_ID = 104;
  }

  try {
    const result = await updatePricePackageMasterService(data);
    res.json({
      success: true,
      message: result.message || "Price package updated successfully",
      PRICE_PACKAGE_ID: result.PRICE_PACKAGE_ID,
    });
  } catch (error: any) {
    console.error("UpdatePricePackageMaster error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deletePricePackageMaster = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "A valid Price Package ID is required" });
    return;
  }

  try {
    const result = await deletePricePackageMasterService(
      id,
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Price package deleted successfully" });
  } catch (error: any) {
    console.error("DeletePricePackageMaster error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
