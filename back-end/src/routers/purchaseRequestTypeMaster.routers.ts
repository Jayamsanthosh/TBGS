import express from "express";
import {
  getAllPurchaseRequestType,
  getPurchaseRequestTypeById,
  getPurchaseRequestTypeLoad,
  savePurchaseRequestType,
  updatePurchaseRequestType,
  deletePurchaseRequestType
} from "../controllers/purchaseRequestTypeMaster.controller";

const PurchaseRequestTypeMasterRouter = express.Router();

PurchaseRequestTypeMasterRouter.get("/", getAllPurchaseRequestType);
PurchaseRequestTypeMasterRouter.get("/load", getPurchaseRequestTypeLoad);
PurchaseRequestTypeMasterRouter.get("/:id", getPurchaseRequestTypeById);
PurchaseRequestTypeMasterRouter.post("/", savePurchaseRequestType);
PurchaseRequestTypeMasterRouter.put("/:id", updatePurchaseRequestType);
PurchaseRequestTypeMasterRouter.delete("/:id", deletePurchaseRequestType);

export default PurchaseRequestTypeMasterRouter;