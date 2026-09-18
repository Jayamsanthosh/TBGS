import express from "express";
import {
  getAllFieldCombined,
  saveFieldCombined,
  updateFieldCombined,
  deleteFieldCombined
} from "../controllers/fieldCombined.controller";

const FieldCombinedRouter = express.Router();

FieldCombinedRouter.get("/", getAllFieldCombined);
FieldCombinedRouter.post("/", saveFieldCombined);
FieldCombinedRouter.put("/:id", updateFieldCombined);
FieldCombinedRouter.delete("/:id", deleteFieldCombined);

export default FieldCombinedRouter;
