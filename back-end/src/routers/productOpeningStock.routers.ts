import express from "express";
import { getAllProductOpeningStock, getProductOpeningStockById, saveProductOpeningStock, updateProductOpeningStock, deleteProductOpeningStock } from "../controllers/productOpeningStock.controller";

const ProductOpeningStockRouter = express.Router();

ProductOpeningStockRouter.get("/", getAllProductOpeningStock);
ProductOpeningStockRouter.get("/:id", getProductOpeningStockById);
ProductOpeningStockRouter.post("/", saveProductOpeningStock);
ProductOpeningStockRouter.put("/:id", updateProductOpeningStock);
ProductOpeningStockRouter.delete("/:id", deleteProductOpeningStock);

export default ProductOpeningStockRouter;
