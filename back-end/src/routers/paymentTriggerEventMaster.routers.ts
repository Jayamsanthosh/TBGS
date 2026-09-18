import express from "express";
import {
  getAllPaymentTriggerEventMaster,
  getPaymentTriggerEventMasterById,
  savePaymentTriggerEventMaster,
  updatePaymentTriggerEventMaster,
  deletePaymentTriggerEventMaster
} from "../controllers/paymentTriggerEventMaster.controller";

const PaymentTriggerEventMasterRouter = express.Router();

PaymentTriggerEventMasterRouter.get("/", getAllPaymentTriggerEventMaster);
PaymentTriggerEventMasterRouter.get("/:id", getPaymentTriggerEventMasterById);
PaymentTriggerEventMasterRouter.post("/", savePaymentTriggerEventMaster);
PaymentTriggerEventMasterRouter.put("/:id", updatePaymentTriggerEventMaster);
PaymentTriggerEventMasterRouter.delete("/:id", deletePaymentTriggerEventMaster);

export default PaymentTriggerEventMasterRouter;
