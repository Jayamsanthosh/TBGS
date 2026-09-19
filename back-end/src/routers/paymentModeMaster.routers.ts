import express from "express";
import {
  getAllPaymentModeMaster,
  getPaymentModeMasterById,
  savePaymentModeMaster,
  updatePaymentModeMaster,
  deletePaymentModeMaster
} from "../controllers/paymentModeMaster.controller";

const PaymentModeMasterRouter = express.Router();

PaymentModeMasterRouter.get("/", getAllPaymentModeMaster);
PaymentModeMasterRouter.get("/:id", getPaymentModeMasterById);
PaymentModeMasterRouter.post("/", savePaymentModeMaster);
PaymentModeMasterRouter.put("/:id", updatePaymentModeMaster);
PaymentModeMasterRouter.delete("/:id", deletePaymentModeMaster);

export default PaymentModeMasterRouter;
