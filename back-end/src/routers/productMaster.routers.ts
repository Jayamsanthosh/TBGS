import express from "express";
import { getAllProductMaster, getProductMasterById, saveProductMaster, updateProductMaster, deleteProductMaster } from "../controllers/productMaster.controller";

const ProductMasterRouter = express.Router();

ProductMasterRouter.get("/", getAllProductMaster);
ProductMasterRouter.get("/:id", getProductMasterById);
ProductMasterRouter.post("/", saveProductMaster);
ProductMasterRouter.put("/:id", updateProductMaster);
ProductMasterRouter.delete("/:id", deleteProductMaster);

export default ProductMasterRouter;
