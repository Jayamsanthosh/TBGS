import express from "express";
import {
  getAllCustomerWiseTripTemplatePriceMapping,
  saveCustomerWiseTripTemplatePriceMapping,
  updateCustomerWiseTripTemplatePriceMapping,
  deleteCustomerWiseTripTemplatePriceMapping
} from "../controllers/customerWiseTripTemplatePriceMapping.controller";

const CustomerWiseTripTemplatePriceMappingRouter = express.Router();

CustomerWiseTripTemplatePriceMappingRouter.get("/", getAllCustomerWiseTripTemplatePriceMapping);
CustomerWiseTripTemplatePriceMappingRouter.post("/", saveCustomerWiseTripTemplatePriceMapping);
CustomerWiseTripTemplatePriceMappingRouter.put("/:id", updateCustomerWiseTripTemplatePriceMapping);
CustomerWiseTripTemplatePriceMappingRouter.delete("/:id", deleteCustomerWiseTripTemplatePriceMapping);

export default CustomerWiseTripTemplatePriceMappingRouter;
