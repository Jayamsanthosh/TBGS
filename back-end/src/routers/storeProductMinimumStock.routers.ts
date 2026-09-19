import { Router } from "express";
import {
  getAllStoreProductMinimumStock,
  getStoreProductMinimumStockById,
  saveStoreProductMinimumStock,
  updateStoreProductMinimumStock,
  deleteStoreProductMinimumStock,
} from "../controllers/storeProductMinimumStock.controller";

const router = Router();

router.get("/", getAllStoreProductMinimumStock);
router.get("/:id", getStoreProductMinimumStockById);
router.post("/", saveStoreProductMinimumStock);
router.put("/:id", updateStoreProductMinimumStock);
router.delete("/:id", deleteStoreProductMinimumStock);

export default router;
