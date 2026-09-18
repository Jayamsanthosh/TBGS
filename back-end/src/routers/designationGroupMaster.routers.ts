import { Router } from "express";
import {
  getAllDesignationGroupMaster,
  getDesignationGroupMasterById,
  saveDesignationGroupMaster,
  updateDesignationGroupMaster,
  deleteDesignationGroupMaster,
} from "../controllers/designationGroupMaster.controller";

const router = Router();

router.get("/", getAllDesignationGroupMaster);
router.get("/:id", getDesignationGroupMasterById);
router.post("/", saveDesignationGroupMaster);
router.put("/:id", updateDesignationGroupMaster);
router.delete("/:id", deleteDesignationGroupMaster);

export default router;
