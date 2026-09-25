import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllProductMasterService,
  getProductMasterByIdService,
  saveProductMasterService,
  updateProductMasterService,
  deleteProductMasterService,
  ProductMasterData
} from "../services/productMaster.services";

export const getAllProductMaster = async (_req: Request, res: Response): Promise<void> => {
  try {
    const products = await getAllProductMasterService();
    res.json({ success: true, count: products.length, data: products });
  } catch (error: any) {
    console.error("GetAllProductMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getProductMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Product ID is required" });
    return;
  }

  try {
    const product = await getProductMasterByIdService(parseInt(id as string, 10));

    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    res.json({ success: true, data: product });
  } catch (error: any) {
    console.error("GetProductMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveProductMaster = async (req: Request, res: Response): Promise<void> => {
  const productData: ProductMasterData = req.body;

  if (!productData.PRODUCT_NAME) {
    res.status(400).json({ success: false, message: "Product Name is required" });
    return;
  }

  if (!productData.COMPANY_ID) {
    res.status(400).json({ success: false, message: "Company is required" });
    return;
  }

  try {
    const result = await saveProductMasterService(productData);
    res.json({ success: true, message: result.message || "Product saved successfully" });
  } catch (error: any) {
    console.error("SaveProductMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateProductMaster = async (req: Request, res: Response): Promise<void> => {
  const productData: ProductMasterData = req.body;
  const { id } = req.params;

  if (!productData.PRODUCT_ID && id) {
    productData.PRODUCT_ID = parseInt(id as string, 10);
  }

  if (!productData.PRODUCT_ID) {
    res.status(400).json({ success: false, message: "Product ID is required" });
    return;
  }

  try {
    const result = await updateProductMasterService(productData);
    res.json({ success: true, message: result.message || "Product updated successfully" });
  } catch (error: any) {
    console.error("UpdateProductMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteProductMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Product ID is required" });
    return;
  }

  try {
    const result = await deleteProductMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Product deleted successfully", PRODUCT_ID: parseInt(id as string, 10) });
  } catch (error: any) {
    console.error("DeleteProductMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
