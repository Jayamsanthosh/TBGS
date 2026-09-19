import express from "express";
import { getAllProductCompanyMainCategoryMapping, getProductCompanyMainCategoryMappingById, saveProductCompanyMainCategoryMapping, updateProductCompanyMainCategoryMapping, deleteProductCompanyMainCategoryMapping } from "../controllers/productCompanyMainCategoryMapping.controller";

const ProductCompanyMainCategoryMappingRouter = express.Router();

ProductCompanyMainCategoryMappingRouter.get("/", getAllProductCompanyMainCategoryMapping);
ProductCompanyMainCategoryMappingRouter.get("/:id", getProductCompanyMainCategoryMappingById);
ProductCompanyMainCategoryMappingRouter.post("/", saveProductCompanyMainCategoryMapping);
ProductCompanyMainCategoryMappingRouter.put("/:id", updateProductCompanyMainCategoryMapping);
ProductCompanyMainCategoryMappingRouter.delete("/:id", deleteProductCompanyMainCategoryMapping);

export default ProductCompanyMainCategoryMappingRouter;
