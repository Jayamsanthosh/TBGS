import express from "express";
import { getAllUserStoreMapping, getUserStoreMappingById, saveUserStoreMapping, updateUserStoreMapping, deleteUserStoreMapping } from "../controllers/userStoreMapping.controller";

const UserStoreMappingRouter = express.Router();

UserStoreMappingRouter.get("/", getAllUserStoreMapping);
UserStoreMappingRouter.get("/:id", getUserStoreMappingById);
UserStoreMappingRouter.post("/", saveUserStoreMapping);
UserStoreMappingRouter.put("/:id", updateUserStoreMapping);
UserStoreMappingRouter.delete("/:id", deleteUserStoreMapping);

export default UserStoreMappingRouter;
