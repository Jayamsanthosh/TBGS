import express from "express";
import { getAllBookingStatusMaster, getBookingStatusMasterById, saveBookingStatusMaster, updateBookingStatusMaster, deleteBookingStatusMaster } from "../controllers/bookingStatusMaster.controller";

const BookingStatusMasterRouter = express.Router();

BookingStatusMasterRouter.get("/", getAllBookingStatusMaster);
BookingStatusMasterRouter.get("/:id", getBookingStatusMasterById);
BookingStatusMasterRouter.post("/", saveBookingStatusMaster);
BookingStatusMasterRouter.put("/:id", updateBookingStatusMaster);
BookingStatusMasterRouter.delete("/:id", deleteBookingStatusMaster);

export default BookingStatusMasterRouter;