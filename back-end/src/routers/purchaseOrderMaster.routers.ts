import express from "express";
import {
  getAllPurchaseOrder,
  getPurchaseOrderHdr,
  getPurchaseOrderDtls,
  getPurchaseOrderDtl,
  getPurchaseOrderSourceQuotations,
  savePurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrderDtl,
  deletePurchaseOrderHdr,
  submitPurchaseOrder
} from "../controllers/purchaseOrderMaster.controller";
import {
  getPurchaseOrderAdditionalCharges,
  getPurchaseOrderAdditionalCharge,
  savePurchaseOrderAdditionalCharge,
  updatePurchaseOrderAdditionalCharge,
  deletePurchaseOrderAdditionalCharge
} from "../controllers/purchaseOrderAdditionalCharge.controller";

const PurchaseOrderMasterRouter = express.Router();

/* Additional charges routes use literal segments ("charge"/"charges") before
   the "/:refNo" wildcard, so they are never read as a reference number. */
PurchaseOrderMasterRouter.get("/charges/:refNo", getPurchaseOrderAdditionalCharges);
PurchaseOrderMasterRouter.get("/charge/:id", getPurchaseOrderAdditionalCharge);
PurchaseOrderMasterRouter.post("/charge", savePurchaseOrderAdditionalCharge);
PurchaseOrderMasterRouter.put("/charge/:id", updatePurchaseOrderAdditionalCharge);
PurchaseOrderMasterRouter.delete("/charge/:id", deletePurchaseOrderAdditionalCharge);

PurchaseOrderMasterRouter.get("/", getAllPurchaseOrder);
/* Query param source list must sit ahead of the ":refNo" wildcards, and the
   literal "source-quotations" segment is never read as a reference number. */
PurchaseOrderMasterRouter.get("/source-quotations", getPurchaseOrderSourceQuotations);
PurchaseOrderMasterRouter.get("/hdr/:refNo", getPurchaseOrderHdr);
PurchaseOrderMasterRouter.get("/dtls/:refNo", getPurchaseOrderDtls);
PurchaseOrderMasterRouter.get("/dtl/:id", getPurchaseOrderDtl);
PurchaseOrderMasterRouter.post("/", savePurchaseOrder);
/* Declared before the "/:refNo" wildcard so the literal "submit" segment is
   never read as part of a reference number. */
PurchaseOrderMasterRouter.put("/:refNo/submit", submitPurchaseOrder);
PurchaseOrderMasterRouter.put("/:refNo", updatePurchaseOrder);
PurchaseOrderMasterRouter.delete("/dtl/:id", deletePurchaseOrderDtl);
PurchaseOrderMasterRouter.delete("/hdr/:refNo", deletePurchaseOrderHdr);

export default PurchaseOrderMasterRouter;