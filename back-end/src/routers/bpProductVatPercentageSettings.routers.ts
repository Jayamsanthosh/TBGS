import { Router } from "express";
import {
  getAll,
  getById,
  save,
  update,
  deleteRecord,
  submit
} from "../controllers/bpProductVatPercentageSettings.controller";

const router = Router();

router.get("/", getAll);
router.get("/:id", getById);
router.post("/", save);
router.put("/:id", update);
router.delete("/:id", deleteRecord);
router.post("/:id/submit", submit);

export default router;
