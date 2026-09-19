import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllAirlinesMasterService,
  getAirlinesMasterByIdService,
  saveAirlinesMasterService,
  updateAirlinesMasterService,
  deleteAirlinesMasterService,
  AirlinesMasterData
} from "../services/airlinesMaster.services";

export const getAllAirlinesMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
    const airlines = await getAllAirlinesMasterService(status);
    res.json({ success: true, count: airlines.length, data: airlines });
  } catch (error: any) {
    console.error("GetAllAirlinesMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getAirlinesMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Airline ID is required" });
    return;
  }

  try {
    const airline = await getAirlinesMasterByIdService(parseInt(id as string, 10));

    if (!airline) {
      res.status(404).json({ success: false, message: "Airline not found" });
      return;
    }

    res.json({ success: true, data: airline });
  } catch (error: any) {
    console.error("GetAirlinesMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveAirlinesMaster = async (req: Request, res: Response): Promise<void> => {
  const airlineData: AirlinesMasterData = req.body;

  if (!airlineData.AIRLINE_NAME) {
    res.status(400).json({ success: false, message: "Airline Name is required" });
    return;
  }

  try {
    const result = await saveAirlinesMasterService(airlineData);
    res.json({ success: true, message: result.message || "Data saved successfully", AIRLINE_ID: result.AIRLINE_ID });
  } catch (error: any) {
    console.error("SaveAirlinesMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateAirlinesMaster = async (req: Request, res: Response): Promise<void> => {
  const airlineData: AirlinesMasterData = req.body;
  const { id } = req.params;

  try {
    if (!airlineData.AIRLINE_ID && id) {
      airlineData.AIRLINE_ID = parseInt(id as string, 10);
    }

    const result = await updateAirlinesMasterService(airlineData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateAirlinesMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteAirlinesMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Airline ID is required" });
    return;
  }

  try {
    const result = await deleteAirlinesMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteAirlinesMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
