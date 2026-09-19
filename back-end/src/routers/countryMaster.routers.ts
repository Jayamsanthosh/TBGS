import express from "express";
import { getAllCountryMaster, getCountryMasterById, saveCountryMaster, updateCountryMaster, deleteCountryMaster } from "../controllers/countryMaster.controller";

const CountryMasterRouter = express.Router();

CountryMasterRouter.get("/", getAllCountryMaster);
CountryMasterRouter.get("/:id", getCountryMasterById);
CountryMasterRouter.post("/", saveCountryMaster);
CountryMasterRouter.put("/:id", updateCountryMaster);
CountryMasterRouter.delete("/:id", deleteCountryMaster);

export default CountryMasterRouter;
