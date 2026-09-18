import express from "express";
import { getAllVatPercentageSetting, getVatPercentageSettingById, saveVatPercentageSetting, updateVatPercentageSetting, deleteVatPercentageSetting } from "../controllers/vatPercentageSetting.controller";

const VatPercentageSettingRouter = express.Router();

VatPercentageSettingRouter.get("/", getAllVatPercentageSetting);
VatPercentageSettingRouter.get("/:id", getVatPercentageSettingById);
VatPercentageSettingRouter.post("/", saveVatPercentageSetting);
VatPercentageSettingRouter.put("/:id", updateVatPercentageSetting);
VatPercentageSettingRouter.delete("/:id", deleteVatPercentageSetting);

export default VatPercentageSettingRouter;
