import express from "express";
import { getAllHotelResortMaster, getHotelResortMasterById, saveHotelResortMaster, updateHotelResortMaster, deleteHotelResortMaster } from "../controllers/hotelResortMaster.controller";

const HotelResortMasterRouter = express.Router();

HotelResortMasterRouter.get("/", getAllHotelResortMaster);
HotelResortMasterRouter.get("/:id", getHotelResortMasterById);
HotelResortMasterRouter.post("/", saveHotelResortMaster);
HotelResortMasterRouter.put("/:id", updateHotelResortMaster);
HotelResortMasterRouter.delete("/:id", deleteHotelResortMaster);

export default HotelResortMasterRouter;
