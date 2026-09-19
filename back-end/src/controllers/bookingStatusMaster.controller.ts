import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  getAllBookingStatusMasterService,
  getBookingStatusMasterByIdService,
  saveBookingStatusMasterService,
  updateBookingStatusMasterService,
  deleteBookingStatusMasterService,
  BookingStatusMasterData
} from "../services/bookingStatusMaster.services";

export const getAllBookingStatusMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
    const bookingStatuses = await getAllBookingStatusMasterService(status);
    res.json({ success: true, count: bookingStatuses.length, data: bookingStatuses });
  } catch (error: any) {
    console.error("GetAllBookingStatusMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getBookingStatusMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Booking Status ID is required" });
    return;
  }

  try {
    const bookingStatus = await getBookingStatusMasterByIdService(parseInt(id as string, 10));

    if (!bookingStatus) {
      res.status(404).json({ success: false, message: "Booking Status not found" });
      return;
    }

    res.json({ success: true, data: bookingStatus });
  } catch (error: any) {
    console.error("GetBookingStatusMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveBookingStatusMaster = async (req: Request, res: Response): Promise<void> => {
  const bookingStatusData: BookingStatusMasterData = req.body;

  if (!bookingStatusData.BOOKING_STATUS_NAME) {
    res.status(400).json({ success: false, message: "Booking Status Name is required" });
    return;
  }

  try {
    const result = await saveBookingStatusMasterService(bookingStatusData);
    res.json({ success: true, message: result.message || "Data saved successfully", BOOKING_STATUS_ID: result.BOOKING_STATUS_ID });
  } catch (error: any) {
    console.error("SaveBookingStatusMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateBookingStatusMaster = async (req: Request, res: Response): Promise<void> => {
  const bookingStatusData: BookingStatusMasterData = req.body;
  const { id } = req.params;

  try {
    if (!bookingStatusData.BOOKING_STATUS_ID && id) {
      bookingStatusData.BOOKING_STATUS_ID = parseInt(id as string, 10);
    }

    const result = await updateBookingStatusMasterService(bookingStatusData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateBookingStatusMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteBookingStatusMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Booking Status ID is required" });
    return;
  }

  try {
    const result = await deleteBookingStatusMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteBookingStatusMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};