import express from "express";
import {
  getAllPurchaseInvoice,
  getPurchaseInvoiceHdr,
  getPurchaseInvoiceDtls,
  getPurchaseInvoiceDtl,
  getPurchaseInvoiceSourceOrders,
  getPurchaseInvoiceSourceOrder,
  savePurchaseInvoice,
  updatePurchaseInvoice,
  deletePurchaseInvoiceDtl,
  deletePurchaseInvoiceHdr,
  getPurchaseInvoiceAdditionalCharges,
  getPurchaseInvoiceAdditionalCharge,
  savePurchaseInvoiceAdditionalCharge,
  updatePurchaseInvoiceAdditionalCharge,
  deletePurchaseInvoiceAdditionalCharge,
} from "../controllers/purchaseInvoiceMaster.controller";
import {
  getPurchaseInvoiceConversations,
  getPurchaseInvoiceConversation,
  getInvoiceConversationResponseStatuses,
  savePurchaseInvoiceConversation,
  updatePurchaseInvoiceConversation,
  deletePurchaseInvoiceConversation,
} from "../controllers/purchaseInvoiceConversation.controller";

const PurchaseInvoiceMasterRouter = express.Router();

/* Literal segments must precede the /:refNo wildcard. */
PurchaseInvoiceMasterRouter.get("/conversation/statuses", getInvoiceConversationResponseStatuses);
PurchaseInvoiceMasterRouter.get("/conversation-row/:id", getPurchaseInvoiceConversation);
PurchaseInvoiceMasterRouter.get("/conversation/:refNo", getPurchaseInvoiceConversations);
PurchaseInvoiceMasterRouter.post("/conversation", savePurchaseInvoiceConversation);
PurchaseInvoiceMasterRouter.put("/conversation/:id", updatePurchaseInvoiceConversation);
PurchaseInvoiceMasterRouter.delete("/conversation/:id", deletePurchaseInvoiceConversation);
PurchaseInvoiceMasterRouter.get("/charges/:refNo", getPurchaseInvoiceAdditionalCharges);
PurchaseInvoiceMasterRouter.get("/charge/:id", getPurchaseInvoiceAdditionalCharge);
PurchaseInvoiceMasterRouter.post("/charge", savePurchaseInvoiceAdditionalCharge);
PurchaseInvoiceMasterRouter.put("/charge/:id", updatePurchaseInvoiceAdditionalCharge);
PurchaseInvoiceMasterRouter.delete("/charge/:id", deletePurchaseInvoiceAdditionalCharge);

PurchaseInvoiceMasterRouter.get("/", getAllPurchaseInvoice);
PurchaseInvoiceMasterRouter.get("/source-orders", getPurchaseInvoiceSourceOrders);
PurchaseInvoiceMasterRouter.get("/source-order/:poNo", getPurchaseInvoiceSourceOrder);
PurchaseInvoiceMasterRouter.get("/hdr/:refNo", getPurchaseInvoiceHdr);
PurchaseInvoiceMasterRouter.get("/dtls/:refNo", getPurchaseInvoiceDtls);
PurchaseInvoiceMasterRouter.get("/dtl/:id", getPurchaseInvoiceDtl);
PurchaseInvoiceMasterRouter.post("/", savePurchaseInvoice);
PurchaseInvoiceMasterRouter.put("/:refNo", updatePurchaseInvoice);
PurchaseInvoiceMasterRouter.delete("/dtl/:id", deletePurchaseInvoiceDtl);
PurchaseInvoiceMasterRouter.delete("/hdr/:refNo", deletePurchaseInvoiceHdr);

export default PurchaseInvoiceMasterRouter;
