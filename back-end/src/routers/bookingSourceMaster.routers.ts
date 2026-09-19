import express from "express";
import { getAllBookingSourceMaster, getBookingSourceMasterById, saveBookingSourceMaster, updateBookingSourceMaster, deleteBookingSourceMaster } from "../controllers/bookingSourceMaster.controller";

const BookingSourceMasterRouter = express.Router();

BookingSourceMasterRouter.get("/", getAllBookingSourceMaster);
BookingSourceMasterRouter.get("/:id", getBookingSourceMasterById);
BookingSourceMasterRouter.post("/", saveBookingSourceMaster);
BookingSourceMasterRouter.put("/:id", updateBookingSourceMaster);
BookingSourceMasterRouter.delete("/:id", deleteBookingSourceMaster);

export default BookingSourceMasterRouter;