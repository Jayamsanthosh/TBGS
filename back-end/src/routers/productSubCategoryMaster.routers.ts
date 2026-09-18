import express from "express";
import { getAllProductSubCategory, getProductSubCategoryById, saveProductSubCategory, updateProductSubCategory, deleteProductSubCategory } from "../controllers/productSubCategoryMaster.controller";

const ProductSubCategoryRouter = express.Router();

ProductSubCategoryRouter.get("/", getAllProductSubCategory);
ProductSubCategoryRouter.get("/:id", getProductSubCategoryById);
ProductSubCategoryRouter.post("/", saveProductSubCategory);
ProductSubCategoryRouter.put("/:id", updateProductSubCategory);
ProductSubCategoryRouter.delete("/:id", deleteProductSubCategory);

export default ProductSubCategoryRouter;
