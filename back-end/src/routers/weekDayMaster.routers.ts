import express from "express";
import {
  getAllWeekDayMaster,
  getWeekDayMasterById,
  saveWeekDayMaster,
  updateWeekDayMaster,
  deleteWeekDayMaster,
} from "../controllers/weekDayMaster.controller";

const WeekDayMasterRouter = express.Router();

WeekDayMasterRouter.get("/", getAllWeekDayMaster);
WeekDayMasterRouter.get("/:id", getWeekDayMasterById);
WeekDayMasterRouter.post("/", saveWeekDayMaster);
WeekDayMasterRouter.put("/:id", updateWeekDayMaster);
WeekDayMasterRouter.delete("/:id", deleteWeekDayMaster);

export default WeekDayMasterRouter;
