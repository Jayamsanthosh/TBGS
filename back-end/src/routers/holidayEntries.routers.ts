import express from "express";
import {
  getAllHolidayEntries,
  getHolidayEntriesById,
  saveHolidayEntries,
  updateHolidayEntries,
  deleteHolidayEntries,
  submitHolidayEntries
} from "../controllers/holidayEntries.controller";

const HolidayEntriesRouter = express.Router();

HolidayEntriesRouter.get("/", getAllHolidayEntries);
HolidayEntriesRouter.get("/:id", getHolidayEntriesById);
HolidayEntriesRouter.post("/:id/submit", submitHolidayEntries);
HolidayEntriesRouter.post("/", saveHolidayEntries);
HolidayEntriesRouter.put("/:id", updateHolidayEntries);
HolidayEntriesRouter.delete("/:id", deleteHolidayEntries);

export default HolidayEntriesRouter;
