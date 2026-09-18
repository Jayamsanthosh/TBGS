import express from "express";
import {
  getAllPromotionDemotionTransferEntries,
  getPromotionDemotionTransferEntryByRefNo,
  savePromotionDemotionTransferEntry,
  updatePromotionDemotionTransferEntry,
  deletePromotionDemotionTransferEntry,
} from "../controllers/promotionDemotionTransferEntries.controller";

const PromotionDemotionTransferEntriesRouter = express.Router();

PromotionDemotionTransferEntriesRouter.get("/", getAllPromotionDemotionTransferEntries);
PromotionDemotionTransferEntriesRouter.get("/:refNo", getPromotionDemotionTransferEntryByRefNo);
PromotionDemotionTransferEntriesRouter.post("/", savePromotionDemotionTransferEntry);
PromotionDemotionTransferEntriesRouter.put("/:sno", updatePromotionDemotionTransferEntry);
PromotionDemotionTransferEntriesRouter.delete("/:refNo", deletePromotionDemotionTransferEntry);

export default PromotionDemotionTransferEntriesRouter;
