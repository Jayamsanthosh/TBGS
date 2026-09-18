import express from "express";
import {
  getAllPromotionDemotionTransferRequest,
  getPromotionDemotionTransferRequestByRefNo,
  savePromotionDemotionTransferRequest,
  updatePromotionDemotionTransferRequest,
  deletePromotionDemotionTransferRequest,
  submitPromotionDemotionTransferRequest,
} from "../controllers/promotionDemotionTransferRequest.controller";

const PromotionDemotionTransferRequestRouter = express.Router();

PromotionDemotionTransferRequestRouter.get("/", getAllPromotionDemotionTransferRequest);
PromotionDemotionTransferRequestRouter.get("/:refNo", getPromotionDemotionTransferRequestByRefNo);
PromotionDemotionTransferRequestRouter.post("/", savePromotionDemotionTransferRequest);
PromotionDemotionTransferRequestRouter.post("/:refNo/submit", submitPromotionDemotionTransferRequest);
PromotionDemotionTransferRequestRouter.put("/:sno", updatePromotionDemotionTransferRequest);
PromotionDemotionTransferRequestRouter.delete("/:refNo", deletePromotionDemotionTransferRequest);

export default PromotionDemotionTransferRequestRouter;