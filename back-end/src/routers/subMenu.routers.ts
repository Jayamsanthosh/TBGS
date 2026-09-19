import express from "express";
import { getAllSubMenu, getSubMenuById, saveSubMenu, updateSubMenu, deleteSubMenu } from "../controllers/subMenu.controller";

const SubMenuRouter = express.Router();

SubMenuRouter.get("/", getAllSubMenu);
SubMenuRouter.get("/:id", getSubMenuById);
SubMenuRouter.post("/", saveSubMenu);
SubMenuRouter.put("/:id", updateSubMenu);
SubMenuRouter.delete("/:id", deleteSubMenu);

export default SubMenuRouter;
