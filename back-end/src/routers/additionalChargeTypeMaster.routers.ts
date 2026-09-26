import express from "express";
import {
  getAllAdditionalChargeType,
  getAdditionalChargeTypeById,
  getAdditionalChargeTypeLoad,
  saveAdditionalChargeType,
  updateAdditionalChargeType,
  deleteAdditionalChargeType
} from "../controllers/additionalChargeTypeMaster.controller";

const AdditionalChargeTypeMasterRouter = express.Router();

AdditionalChargeTypeMasterRouter.get("/", getAllAdditionalChargeType);
AdditionalChargeTypeMasterRouter.get("/load", getAdditionalChargeTypeLoad);
AdditionalChargeTypeMasterRouter.get("/:id", getAdditionalChargeTypeById);
AdditionalChargeTypeMasterRouter.post("/", saveAdditionalChargeType);
AdditionalChargeTypeMasterRouter.put("/:id", updateAdditionalChargeType);
AdditionalChargeTypeMasterRouter.delete("/:id", deleteAdditionalChargeType);

export default AdditionalChargeTypeMasterRouter;
