import express from "express";
import {
  getAllWarningForms,
  getWarningFormById,
  saveWarningForms,
  updateWarningForms,
  deleteWarningForms,
} from "../controllers/warningForms.controller";

const WarningFormsRouter = express.Router();

WarningFormsRouter.get("/", getAllWarningForms);
WarningFormsRouter.get("/:id", getWarningFormById);
WarningFormsRouter.post("/", saveWarningForms);
WarningFormsRouter.put("/:id", updateWarningForms);
WarningFormsRouter.delete("/:id", deleteWarningForms);

export default WarningFormsRouter;