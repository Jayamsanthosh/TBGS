import express from "express";
import {
  getAllClientAdditionalServicesMaster,
  getClientAdditionalServicesMasterById,
  saveClientAdditionalServicesMaster,
  updateClientAdditionalServicesMaster,
  deleteClientAdditionalServicesMaster
} from "../controllers/clientAdditionalServicesMaster.controller";

const ClientAdditionalServicesMasterRouter = express.Router();

ClientAdditionalServicesMasterRouter.get("/", getAllClientAdditionalServicesMaster);
ClientAdditionalServicesMasterRouter.get("/:id", getClientAdditionalServicesMasterById);
ClientAdditionalServicesMasterRouter.post("/", saveClientAdditionalServicesMaster);
ClientAdditionalServicesMasterRouter.put("/:id", updateClientAdditionalServicesMaster);
ClientAdditionalServicesMasterRouter.delete("/:id", deleteClientAdditionalServicesMaster);

export default ClientAdditionalServicesMasterRouter;
