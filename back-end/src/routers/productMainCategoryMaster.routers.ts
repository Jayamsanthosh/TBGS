import express from "express";
import { getAllProductMainCategory, getProductMainCategoryById, saveProductMainCategory, updateProductMainCategory, deleteProductMainCategory } from "../controllers/productMainCategoryMaster.controller";

const ProductMainCategoryRouter = express.Router();

ProductMainCategoryRouter.get("/", getAllProductMainCategory);
ProductMainCategoryRouter.get("/:id", getProductMainCategoryById);
ProductMainCategoryRouter.post("/", saveProductMainCategory);
ProductMainCategoryRouter.put("/:id", updateProductMainCategory);
ProductMainCategoryRouter.delete("/:id", deleteProductMainCategory);

export default ProductMainCategoryRouter;
