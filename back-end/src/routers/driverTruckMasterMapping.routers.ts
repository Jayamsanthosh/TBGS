import { Router } from "express";
import {
  getAllMapping,
  getMappingById,
  getDriverOptions,
  getTruckOptions,
  saveMapping,
  updateMapping,
  deleteMapping,
} from "../controllers/driverTruckMasterMapping.controller";

const router = Router();

router.get("/driver-options", getDriverOptions);
router.get("/truck-options", getTruckOptions);
router.get("/", getAllMapping);
router.get("/:id", getMappingById);
router.post("/", saveMapping);
router.put("/:id", updateMapping);
router.delete("/:id", deleteMapping);

export default router;
