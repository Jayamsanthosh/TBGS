import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  getAllBookingSourceMasterService,
  getBookingSourceMasterByIdService,
  saveBookingSourceMasterService,
  updateBookingSourceMasterService,
  deleteBookingSourceMasterService,
  BookingSourceMasterData
} from "../services/bookingSourceMaster.services";

export const getAllBookingSourceMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
    const bookingSources = await getAllBookingSourceMasterService(status);
    res.json({ success: true, count: bookingSources.length, data: bookingSources });
  } catch (error: any) {
    console.error("GetAllBookingSourceMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getBookingSourceMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Booking Source ID is required" });
    return;
  }

  try {
    const bookingSource = await getBookingSourceMasterByIdService(parseInt(id as string, 10));

    if (!bookingSource) {
      res.status(404).json({ success: false, message: "Booking Source not found" });
      return;
    }

    res.json({ success: true, data: bookingSource });
  } catch (error: any) {
    console.error("GetBookingSourceMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveBookingSourceMaster = async (req: Request, res: Response): Promise<void> => {
  const bookingSourceData: BookingSourceMasterData = req.body;

  if (!bookingSourceData.BOOKING_SOURCE_NAME) {
    res.status(400).json({ success: false, message: "Booking Source Name is required" });
    return;
  }

  try {
    const result = await saveBookingSourceMasterService(bookingSourceData);
    res.json({ success: true, message: result.message || "Data saved successfully", BOOKING_SOURCE_ID: result.BOOKING_SOURCE_ID });
  } catch (error: any) {
    console.error("SaveBookingSourceMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateBookingSourceMaster = async (req: Request, res: Response): Promise<void> => {
  const bookingSourceData: BookingSourceMasterData = req.body;
  const { id } = req.params;

  try {
    if (!bookingSourceData.BOOKING_SOURCE_ID && id) {
      bookingSourceData.BOOKING_SOURCE_ID = parseInt(id as string, 10);
    }

    const result = await updateBookingSourceMasterService(bookingSourceData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateBookingSourceMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteBookingSourceMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Booking Source ID is required" });
    return;
  }

  try {
    const result = await deleteBookingSourceMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteBookingSourceMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};