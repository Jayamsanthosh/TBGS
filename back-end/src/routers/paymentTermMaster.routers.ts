import express from "express";
import {
  getAllPaymentTermMaster,
  getPaymentTermMasterById,
  savePaymentTermMaster,
  updatePaymentTermMaster,
  deletePaymentTermMaster
} from "../controllers/paymentTermMaster.controller";

const PaymentTermMasterRouter = express.Router();

PaymentTermMasterRouter.get("/", getAllPaymentTermMaster);
PaymentTermMasterRouter.get("/:id", getPaymentTermMasterById);
PaymentTermMasterRouter.post("/", savePaymentTermMaster);
PaymentTermMasterRouter.put("/:id", updatePaymentTermMaster);
PaymentTermMasterRouter.delete("/:id", deletePaymentTermMaster);

export default PaymentTermMasterRouter;
