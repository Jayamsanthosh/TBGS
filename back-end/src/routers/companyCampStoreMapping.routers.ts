import { Router } from "express";
import {
  getAllMapping,
  getMappingById,
  saveMapping,
  updateMapping,
  deleteMapping,
} from "../controllers/companyCampStoreMapping.controller";

const router = Router();

router.get("/", getAllMapping);
router.get("/:id", getMappingById);
router.post("/", saveMapping);
router.put("/:id", updateMapping);
router.delete("/:id", deleteMapping);

export default router;
