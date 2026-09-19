import express from "express";
import {
  getAllCreditLimitPaymentModeMaster,
  getCreditLimitPaymentModeMasterById,
  saveCreditLimitPaymentModeMaster,
  updateCreditLimitPaymentModeMaster,
  deleteCreditLimitPaymentModeMaster
} from "../controllers/creditLimitPaymentModeMaster.controller";

const CreditLimitPaymentModeMasterRouter = express.Router();

CreditLimitPaymentModeMasterRouter.get("/", getAllCreditLimitPaymentModeMaster);
CreditLimitPaymentModeMasterRouter.get("/:id", getCreditLimitPaymentModeMasterById);
CreditLimitPaymentModeMasterRouter.post("/", saveCreditLimitPaymentModeMaster);
CreditLimitPaymentModeMasterRouter.put("/:id", updateCreditLimitPaymentModeMaster);
CreditLimitPaymentModeMasterRouter.delete("/:id", deleteCreditLimitPaymentModeMaster);

export default CreditLimitPaymentModeMasterRouter;
