import express from "express"
import { getAllUsers, showUser, saveUser, updateUser, deleteUser } from "../controllers/user.controller";

const UserRouter = express.Router()

UserRouter.get("/", getAllUsers);
UserRouter.get("/:id", showUser);
UserRouter.post("/", saveUser);
UserRouter.put("/:id", updateUser);
UserRouter.delete("/:id", deleteUser);

export default UserRouter;
