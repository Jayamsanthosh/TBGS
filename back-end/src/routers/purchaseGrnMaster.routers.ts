import express from "express";
import {
  getAllPurchaseGrn,
  getPurchaseGrnHdr,
  getPurchaseGrnDtls,
  getPurchaseGrnDtl,
  savePurchaseGrn,
  updatePurchaseGrn,
  deletePurchaseGrnDtl,
  deletePurchaseGrnHdr
} from "../controllers/purchaseGrnMaster.controller";

const PurchaseGrnMasterRouter = express.Router();

PurchaseGrnMasterRouter.get("/", getAllPurchaseGrn);
PurchaseGrnMasterRouter.get("/hdr/:refNo", getPurchaseGrnHdr);
PurchaseGrnMasterRouter.get("/dtls/:refNo", getPurchaseGrnDtls);
PurchaseGrnMasterRouter.get("/dtl/:id", getPurchaseGrnDtl);
PurchaseGrnMasterRouter.post("/", savePurchaseGrn);
PurchaseGrnMasterRouter.put("/:refNo", updatePurchaseGrn);
PurchaseGrnMasterRouter.delete("/dtl/:id", deletePurchaseGrnDtl);
PurchaseGrnMasterRouter.delete("/:refNo", deletePurchaseGrnHdr);

export default PurchaseGrnMasterRouter;
