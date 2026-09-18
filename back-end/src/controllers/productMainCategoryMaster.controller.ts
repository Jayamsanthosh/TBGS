import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllProductMainCategoryService,
  getProductMainCategoryByIdService,
  saveProductMainCategoryService,
  updateProductMainCategoryService,
  deleteProductMainCategoryService,
  ProductMainCategoryData
} from "../services/productMainCategoryMaster.services";

export const getAllProductMainCategory = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await getAllProductMainCategoryService();
    res.json({ success: true, count: categories.length, data: categories });
  } catch (error: any) {
    console.error("GetAllProductMainCategory error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getProductMainCategoryById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Main Category ID is required" });
    return;
  }

  try {
    const category = await getProductMainCategoryByIdService(parseInt(id as string, 10));

    if (!category) {
      res.status(404).json({ success: false, message: "Main category not found" });
      return;
    }

    res.json({ success: true, data: category });
  } catch (error: any) {
    console.error("GetProductMainCategoryById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveProductMainCategory = async (req: Request, res: Response): Promise<void> => {
  const categoryData: ProductMainCategoryData = req.body;

  if (!categoryData.MAIN_CATEGORY_NAME) {
    res.status(400).json({ success: false, message: "Main Category Name is required" });
    return;
  }

  try {
    const result = await saveProductMainCategoryService(categoryData);
    res.json({ success: true, message: result.message || "Main category saved successfully" });
  } catch (error: any) {
    console.error("SaveProductMainCategory error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateProductMainCategory = async (req: Request, res: Response): Promise<void> => {
  const categoryData: ProductMainCategoryData = req.body;
  const { id } = req.params;

  try {
    if (!categoryData.MAIN_CATEGORY_ID && id) {
      categoryData.MAIN_CATEGORY_ID = parseInt(id as string, 10);
    }

    const result = await updateProductMainCategoryService(categoryData);
    res.json({ success: true, message: result.message || "Main category updated successfully" });
  } catch (error: any) {
    console.error("UpdateProductMainCategory error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteProductMainCategory = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Main Category ID is required" });
    return;
  }

  try {
    const result = await deleteProductMainCategoryService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Main category deleted successfully" });
  } catch (error: any) {
    console.error("DeleteProductMainCategory error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
