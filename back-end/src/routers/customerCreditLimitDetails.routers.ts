import express from "express";
import {
  getAllCustomerCreditLimitDetails,
  getCustomerCreditLimitDetailsById,
  saveCustomerCreditLimitDetails,
  updateCustomerCreditLimitDetails,
  deleteCustomerCreditLimitDetails
} from "../controllers/customerCreditLimitDetails.controller";

const CustomerCreditLimitDetailsRouter = express.Router();

CustomerCreditLimitDetailsRouter.get("/", getAllCustomerCreditLimitDetails);
CustomerCreditLimitDetailsRouter.get("/:id", getCustomerCreditLimitDetailsById);
CustomerCreditLimitDetailsRouter.post("/", saveCustomerCreditLimitDetails);
CustomerCreditLimitDetailsRouter.put("/:id", updateCustomerCreditLimitDetails);
CustomerCreditLimitDetailsRouter.delete("/:id", deleteCustomerCreditLimitDetails);

export default CustomerCreditLimitDetailsRouter;
