import express from "express";
import { getAllBookingTypeMaster, getBookingTypeMasterById, saveBookingTypeMaster, updateBookingTypeMaster, deleteBookingTypeMaster } from "../controllers/bookingTypeMaster.controller";

const BookingTypeMasterRouter = express.Router();

BookingTypeMasterRouter.get("/", getAllBookingTypeMaster);
BookingTypeMasterRouter.get("/:id", getBookingTypeMasterById);
BookingTypeMasterRouter.post("/", saveBookingTypeMaster);
BookingTypeMasterRouter.put("/:id", updateBookingTypeMaster);
BookingTypeMasterRouter.delete("/:id", deleteBookingTypeMaster);

export default BookingTypeMasterRouter;