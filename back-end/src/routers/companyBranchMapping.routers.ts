import { Router } from "express";
import {
  getAllMapping,
  getMappingById,
  loadMapping,
  saveMapping,
  updateMapping,
  deleteMapping,
} from "../controllers/companyBranchMapping.controller";

const router = Router();

router.get("/", getAllMapping);
/* Declared before "/:id" so the literal path is not swallowed as an id. */
router.get("/load", loadMapping);
router.get("/:id", getMappingById);
router.post("/", saveMapping);
router.put("/:id", updateMapping);
router.delete("/:id", deleteMapping);

export default router;
