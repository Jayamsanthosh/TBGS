import express from "express";
import {
  getAllSubMenuMapping,
  getSubMenuMappingById,
  saveSubMenuMapping,
  updateSubMenuMapping,
  deleteSubMenuMapping,
} from "../controllers/subMenuMapping.controller";

const SubMenuMappingRouter = express.Router();

SubMenuMappingRouter.get("/", getAllSubMenuMapping);
SubMenuMappingRouter.get("/:id", getSubMenuMappingById);
SubMenuMappingRouter.post("/", saveSubMenuMapping);
SubMenuMappingRouter.put("/:id", updateSubMenuMapping);
SubMenuMappingRouter.delete("/:id", deleteSubMenuMapping);

export default SubMenuMappingRouter;
