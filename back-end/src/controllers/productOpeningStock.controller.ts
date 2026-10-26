import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllProductOpeningStockService,
  getProductOpeningStockByIdService,
  saveProductOpeningStockService,
  updateProductOpeningStockService,
  deleteProductOpeningStockService,
  ProductOpeningStockData
} from "../services/productOpeningStock.services";

export const getAllProductOpeningStock = async (_req: Request, res: Response): Promise<void> => {
  try {
    const records = await getAllProductOpeningStockService();
    res.json({ success: true, count: records.length, data: records });
  } catch (error: any) {
    console.error("GetAllProductOpeningStock error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getProductOpeningStockById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "SNO is required" });
    return;
  }

  try {
    const rawLinkId = req.query.LINK_ID ?? req.query.link_id;
    const linkId = rawLinkId != null && rawLinkId !== "" ? Number(rawLinkId) : null;
    const record = await getProductOpeningStockByIdService(
      parseInt(id as string, 10),
      linkId != null && Number.isFinite(linkId) ? linkId : null
    );

    if (!record) {
      res.status(404).json({ success: false, message: "Product opening stock not found" });
      return;
    }

    res.json({ success: true, data: record });
  } catch (error: any) {
    console.error("GetProductOpeningStockById error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveProductOpeningStock = async (req: Request, res: Response): Promise<void> => {
  const data: ProductOpeningStockData = req.body;

  if (!data.OPENING_STOCK_DATE) {
    res.status(400).json({ success: false, message: "Opening stock date is required" });
    return;
  }

  const rawLinkId = data.LINK_ID ?? req.query.LINK_ID ?? req.query.link_id;
  const linkId = rawLinkId != null && rawLinkId !== "" ? Number(rawLinkId) : null;
  data.LINK_ID = linkId != null && Number.isFinite(linkId) ? linkId : null;

  const { USER, MAC_ADDRESS } = identityFrom(req);
  data.USER = USER || data.USER || "Admin";
  data.MAC_ADDRESS = MAC_ADDRESS || data.MAC_ADDRESS || "WEB";

  try {
    const result = await saveProductOpeningStockService(data);
    res.json({ success: true, message: result.message || "Data saved successfully", SNO: result.SNO });
  } catch (error: any) {
    console.error("SaveProductOpeningStock error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateProductOpeningStock = async (req: Request, res: Response): Promise<void> => {
  const data: ProductOpeningStockData = req.body;
  const { id } = req.params;

  try {
    if (!data.SNO && id) {
      data.SNO = parseInt(id as string, 10);
    }

    const rawLinkId = data.LINK_ID ?? req.query.LINK_ID ?? req.query.link_id;
    const linkId = rawLinkId != null && rawLinkId !== "" ? Number(rawLinkId) : null;
    data.LINK_ID = linkId != null && Number.isFinite(linkId) ? linkId : null;

    const { USER, MAC_ADDRESS } = identityFrom(req);
    data.USER = USER || data.USER || "Admin";
    data.MAC_ADDRESS = MAC_ADDRESS || data.MAC_ADDRESS || "WEB";

    const result = await updateProductOpeningStockService(data);
    res.json({ success: true, message: result.message || "Record updated successfully", SNO: result.SNO });
  } catch (error: any) {
    console.error("UpdateProductOpeningStock error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteProductOpeningStock = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "SNO is required" });
    return;
  }

  try {
    const { USER: user, ROLE: role, MAC_ADDRESS: macAddress } = identityFrom(req);
    const result = await deleteProductOpeningStockService(parseInt(id as string, 10), user, role, macAddress);
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteProductOpeningStock error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
