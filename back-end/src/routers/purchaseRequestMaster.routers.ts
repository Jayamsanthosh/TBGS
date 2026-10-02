import express from "express";
import {
  getAllPurchaseRequest,
  getPurchaseRequestHdr,
  getPurchaseRequestDtls,
  getPurchaseRequestDtl,
  getPurchaseRequestLoad,
  savePurchaseRequest,
  updatePurchaseRequest,
  deletePurchaseRequestDtl,
  deletePurchaseRequestHdr,
  submitPurchaseRequest
} from "../controllers/purchaseRequestMaster.controller";

const PurchaseRequestMasterRouter = express.Router();

PurchaseRequestMasterRouter.get("/", getAllPurchaseRequest);
PurchaseRequestMasterRouter.get("/load", getPurchaseRequestLoad);
PurchaseRequestMasterRouter.get("/hdr/:refNo", getPurchaseRequestHdr);
PurchaseRequestMasterRouter.get("/dtls/:refNo", getPurchaseRequestDtls);
PurchaseRequestMasterRouter.get("/dtl/:id", getPurchaseRequestDtl);
PurchaseRequestMasterRouter.post("/", savePurchaseRequest);
/* Declared before the "/:refNo" wildcard so the literal "submit" segment is
   never swallowed as a ref number. */
PurchaseRequestMasterRouter.put("/:refNo/submit", submitPurchaseRequest);
PurchaseRequestMasterRouter.put("/:refNo", updatePurchaseRequest);
PurchaseRequestMasterRouter.delete("/dtl/:id", deletePurchaseRequestDtl);
PurchaseRequestMasterRouter.delete("/hdr/:refNo", deletePurchaseRequestHdr);

export default PurchaseRequestMasterRouter;