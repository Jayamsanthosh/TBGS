import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  getAllBookingTypeMasterService,
  getBookingTypeMasterByIdService,
  saveBookingTypeMasterService,
  updateBookingTypeMasterService,
  deleteBookingTypeMasterService,
  BookingTypeMasterData
} from "../services/bookingTypeMaster.services";

export const getAllBookingTypeMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
    const bookingTypes = await getAllBookingTypeMasterService(status);
    res.json({ success: true, count: bookingTypes.length, data: bookingTypes });
  } catch (error: any) {
    console.error("GetAllBookingTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getBookingTypeMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Booking Type ID is required" });
    return;
  }

  try {
    const bookingType = await getBookingTypeMasterByIdService(parseInt(id as string, 10));

    if (!bookingType) {
      res.status(404).json({ success: false, message: "Booking Type not found" });
      return;
    }

    res.json({ success: true, data: bookingType });
  } catch (error: any) {
    console.error("GetBookingTypeMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveBookingTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const bookingTypeData: BookingTypeMasterData = req.body;

  if (!bookingTypeData.BOOKING_TYPE_NAME) {
    res.status(400).json({ success: false, message: "Booking Type Name is required" });
    return;
  }

  try {
    const result = await saveBookingTypeMasterService(bookingTypeData);
    res.json({ success: true, message: result.message || "Data saved successfully", BOOKING_TYPE_ID: result.BOOKING_TYPE_ID });
  } catch (error: any) {
    console.error("SaveBookingTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateBookingTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const bookingTypeData: BookingTypeMasterData = req.body;
  const { id } = req.params;

  try {
    if (!bookingTypeData.BOOKING_TYPE_ID && id) {
      bookingTypeData.BOOKING_TYPE_ID = parseInt(id as string, 10);
    }

    const result = await updateBookingTypeMasterService(bookingTypeData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateBookingTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteBookingTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Booking Type ID is required" });
    return;
  }

  try {
    const result = await deleteBookingTypeMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteBookingTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};