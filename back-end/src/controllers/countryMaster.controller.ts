import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllCountryMasterService,
  getCountryMasterByIdService,
  saveCountryMasterService,
  updateCountryMasterService,
  deleteCountryMasterService,
  CountryMasterData
} from "../services/countryMaster.services";

export const getAllCountryMaster = async (_req: Request, res: Response): Promise<void> => {
  try {
    const countries = await getAllCountryMasterService();
    res.json({ success: true, count: countries.length, data: countries });
  } catch (error: any) {
    console.error("GetAllCountryMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getCountryMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Country ID is required" });
    return;
  }

  try {
    const country = await getCountryMasterByIdService(parseInt(id as string, 10));

    if (!country) {
      res.status(404).json({ success: false, message: "Country not found" });
      return;
    }

    res.json({ success: true, data: country });
  } catch (error: any) {
    console.error("GetCountryMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveCountryMaster = async (req: Request, res: Response): Promise<void> => {
  const countryData: CountryMasterData = req.body;

  if (!countryData.Country_Name) {
    res.status(400).json({ success: false, message: "Country Name is required" });
    return;
  }

  try {
    const result = await saveCountryMasterService(countryData);
    res.json({ success: true, message: result.message || "Country saved successfully" });
  } catch (error: any) {
    console.error("SaveCountryMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateCountryMaster = async (req: Request, res: Response): Promise<void> => {
  const countryData: CountryMasterData = req.body;
  const { id } = req.params;

  try {
    if (!countryData.Country_Id && id) {
      countryData.Country_Id = parseInt(id as string, 10);
    }

    const result = await updateCountryMasterService(countryData);
    res.json({ success: true, message: result.message || "Country updated successfully" });
  } catch (error: any) {
    console.error("UpdateCountryMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteCountryMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Country ID is required" });
    return;
  }

  try {
    const result = await deleteCountryMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Country deleted successfully" });
  } catch (error: any) {
    console.error("DeleteCountryMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
