import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllCaliberMasterService,
  getCaliberMasterByIdService,
  saveCaliberMasterService,
  updateCaliberMasterService,
  deleteCaliberMasterService,
  CaliberMasterData
} from "../services/caliberMaster.services";

export const getAllCaliberMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "AC";
    const calibers = await getAllCaliberMasterService(status);
    res.json({ success: true, count: calibers.length, data: calibers });
  } catch (error: any) {
    console.error("GetAllCaliberMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getCaliberMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Caliber ID is required" });
    return;
  }

  try {
    const caliber = await getCaliberMasterByIdService(parseInt(id as string, 10));

    if (!caliber) {
      res.status(404).json({ success: false, message: "Caliber not found" });
      return;
    }

    res.json({ success: true, data: caliber });
  } catch (error: any) {
    console.error("GetCaliberMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveCaliberMaster = async (req: Request, res: Response): Promise<void> => {
  const caliberData: CaliberMasterData = req.body;

  if (!caliberData.CALIBER_CODE) {
    res.status(400).json({ success: false, message: "Caliber Code is required" });
    return;
  }
  if (!caliberData.CALIBER_NAME) {
    res.status(400).json({ success: false, message: "Caliber Name is required" });
    return;
  }

  try {
    const result = await saveCaliberMasterService(caliberData);
    res.json({ success: true, message: result.message || "Data saved successfully", CALIBER_ID: result.CALIBER_ID });
  } catch (error: any) {
    console.error("SaveCaliberMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateCaliberMaster = async (req: Request, res: Response): Promise<void> => {
  const caliberData: CaliberMasterData = req.body;
  const { id } = req.params;

  try {
    if (!caliberData.CALIBER_ID && id) {
      caliberData.CALIBER_ID = parseInt(id as string, 10);
    }

    const result = await updateCaliberMasterService(caliberData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateCaliberMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteCaliberMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Caliber ID is required" });
    return;
  }

  try {
    const result = await deleteCaliberMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteCaliberMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
