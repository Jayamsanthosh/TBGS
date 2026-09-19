import express from "express";
import { getAllMainMenu, getMainMenuById, saveMainMenu, updateMainMenu, deleteMainMenu } from "../controllers/mainMenu.controller";

const MainMenuRouter = express.Router();

MainMenuRouter.get("/", getAllMainMenu);
MainMenuRouter.get("/:id", getMainMenuById);
MainMenuRouter.post("/", saveMainMenu);
MainMenuRouter.put("/:id", updateMainMenu);
MainMenuRouter.delete("/:id", deleteMainMenu);

export default MainMenuRouter;
