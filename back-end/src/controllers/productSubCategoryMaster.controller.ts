import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllProductSubCategoryService,
  getProductSubCategoryByIdService,
  saveProductSubCategoryService,
  updateProductSubCategoryService,
  deleteProductSubCategoryService,
  ProductSubCategoryData
} from "../services/productSubCategoryMaster.services";

export const getAllProductSubCategory = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await getAllProductSubCategoryService();
    res.json({ success: true, count: categories.length, data: categories });
  } catch (error: any) {
    console.error("GetAllProductSubCategory error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getProductSubCategoryById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Sub Category ID is required" });
    return;
  }

  try {
    const category = await getProductSubCategoryByIdService(parseInt(id as string, 10));

    if (!category) {
      res.status(404).json({ success: false, message: "Sub category not found" });
      return;
    }

    res.json({ success: true, data: category });
  } catch (error: any) {
    console.error("GetProductSubCategoryById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveProductSubCategory = async (req: Request, res: Response): Promise<void> => {
  const categoryData: ProductSubCategoryData = req.body;

  if (!categoryData.SUB_CATEGORY_NAME) {
    res.status(400).json({ success: false, message: "Sub Category Name is required" });
    return;
  }

  try {
    const result = await saveProductSubCategoryService(categoryData);
    res.json({ success: true, message: result.message || "Sub category saved successfully" });
  } catch (error: any) {
    console.error("SaveProductSubCategory error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateProductSubCategory = async (req: Request, res: Response): Promise<void> => {
  const categoryData: ProductSubCategoryData = req.body;
  const { id } = req.params;

  try {
    if (!categoryData.SUB_CATEGORY_ID && id) {
      categoryData.SUB_CATEGORY_ID = parseInt(id as string, 10);
    }

    const result = await updateProductSubCategoryService(categoryData);
    res.json({ success: true, message: result.message || "Sub category updated successfully" });
  } catch (error: any) {
    console.error("UpdateProductSubCategory error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteProductSubCategory = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Sub Category ID is required" });
    return;
  }

  try {
    const result = await deleteProductSubCategoryService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Sub category deleted successfully" });
  } catch (error: any) {
    console.error("DeleteProductSubCategory error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
