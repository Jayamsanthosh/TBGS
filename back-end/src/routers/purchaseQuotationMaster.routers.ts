import express from "express";
import {
  getAllPurchaseQuotation,
  getPurchaseQuotationHdr,
  getPurchaseQuotationDtls,
  getPurchaseQuotationDtl,
  getPurchaseQuotationLoad,
  savePurchaseQuotation,
  updatePurchaseQuotation,
  deletePurchaseQuotationDtl,
  deletePurchaseQuotationHdr,
  submitPurchaseQuotation
} from "../controllers/purchaseQuotationMaster.controller";
import {
  getPurchaseQuotationConversations,
  getPurchaseQuotationConversation,
  getConversationResponseStatuses,
  savePurchaseQuotationConversation,
  updatePurchaseQuotationConversation,
  deletePurchaseQuotationConversation
} from "../controllers/purchaseQuotationConversation.controller";
import {
  getPurchaseQuotationAdditionalCharges,
  getPurchaseQuotationAdditionalCharge,
  savePurchaseQuotationAdditionalCharge,
  updatePurchaseQuotationAdditionalCharge,
  deletePurchaseQuotationAdditionalCharge
} from "../controllers/purchaseQuotationAdditionalCharge.controller";

const PurchaseQuotationMasterRouter = express.Router();

/* Conversation routes are declared before the wildcards below, and the literal
   "statuses" path before "/conversation/:refNo", so neither can be swallowed. */
PurchaseQuotationMasterRouter.get("/conversation/statuses", getConversationResponseStatuses);
PurchaseQuotationMasterRouter.get("/conversation/:refNo", getPurchaseQuotationConversations);
PurchaseQuotationMasterRouter.get("/conversation-row/:sno", getPurchaseQuotationConversation);
PurchaseQuotationMasterRouter.post("/conversation", savePurchaseQuotationConversation);
PurchaseQuotationMasterRouter.put("/conversation/:sno", updatePurchaseQuotationConversation);
PurchaseQuotationMasterRouter.delete("/conversation/:sno", deletePurchaseQuotationConversation);

/* Additional charges routes use literal segments ("charge"/"charges") before
   the "/:refNo" wildcard, so they are never read as a reference number. */
PurchaseQuotationMasterRouter.get("/charges/:refNo", getPurchaseQuotationAdditionalCharges);
PurchaseQuotationMasterRouter.get("/charge/:id", getPurchaseQuotationAdditionalCharge);
PurchaseQuotationMasterRouter.post("/charge", savePurchaseQuotationAdditionalCharge);
PurchaseQuotationMasterRouter.put("/charge/:id", updatePurchaseQuotationAdditionalCharge);
PurchaseQuotationMasterRouter.delete("/charge/:id", deletePurchaseQuotationAdditionalCharge);

PurchaseQuotationMasterRouter.get("/", getAllPurchaseQuotation);
PurchaseQuotationMasterRouter.get("/load", getPurchaseQuotationLoad);
PurchaseQuotationMasterRouter.get("/hdr/:refNo", getPurchaseQuotationHdr);
PurchaseQuotationMasterRouter.get("/dtls/:refNo", getPurchaseQuotationDtls);
PurchaseQuotationMasterRouter.get("/dtl/:id", getPurchaseQuotationDtl);
PurchaseQuotationMasterRouter.post("/", savePurchaseQuotation);
/* Declared before the "/:refNo" wildcard so the literal "submit" segment is
   never read as part of a reference number. */
PurchaseQuotationMasterRouter.put("/:refNo/submit", submitPurchaseQuotation);
PurchaseQuotationMasterRouter.put("/:refNo", updatePurchaseQuotation);
PurchaseQuotationMasterRouter.delete("/dtl/:id", deletePurchaseQuotationDtl);
PurchaseQuotationMasterRouter.delete("/hdr/:refNo", deletePurchaseQuotationHdr);

export default PurchaseQuotationMasterRouter;
