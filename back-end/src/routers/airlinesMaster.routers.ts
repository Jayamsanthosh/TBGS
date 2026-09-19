import express from "express";
import { getAllAirlinesMaster, getAirlinesMasterById, saveAirlinesMaster, updateAirlinesMaster, deleteAirlinesMaster } from "../controllers/airlinesMaster.controller";

const AirlinesMasterRouter = express.Router();

AirlinesMasterRouter.get("/", getAllAirlinesMaster);
AirlinesMasterRouter.get("/:id", getAirlinesMasterById);
AirlinesMasterRouter.post("/", saveAirlinesMaster);
AirlinesMasterRouter.put("/:id", updateAirlinesMaster);
AirlinesMasterRouter.delete("/:id", deleteAirlinesMaster);

export default AirlinesMasterRouter;
