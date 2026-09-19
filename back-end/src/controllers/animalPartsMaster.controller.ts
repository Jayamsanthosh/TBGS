import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllAnimalPartsMasterService,
  getAnimalPartsMasterByIdService,
  saveAnimalPartsMasterService,
  updateAnimalPartsMasterService,
  deleteAnimalPartsMasterService,
  type AnimalPartsMasterData,
} from "../services/animalPartsMaster.services";

export const getAllAnimalPartsMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const items = await getAllAnimalPartsMasterService(status || undefined);
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllAnimalPartsMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getAnimalPartsMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "ANIMAL_PARTS_ID is required" });
    return;
  }

  try {
    const item = await getAnimalPartsMasterByIdService(parseInt(id as string, 10));

    if (!item) {
      res.status(404).json({ success: false, message: "Animal parts not found" });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetAnimalPartsMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

const VALID_STATUSES = ["AC", "IA"];

export const saveAnimalPartsMaster = async (req: Request, res: Response): Promise<void> => {
  const data: AnimalPartsMasterData = req.body;

  if (!data.ANIMAL_PARTS_NAME?.trim()) {
    res.status(400).json({ success: false, message: "Animal parts name is required" });
    return;
  }

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    const result = await saveAnimalPartsMasterService(data);
    res.json({ success: true, message: result.message || "Data saved successfully", ANIMAL_PARTS_ID: result.ANIMAL_PARTS_ID });
  } catch (error: any) {
    console.error("SaveAnimalPartsMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateAnimalPartsMaster = async (req: Request, res: Response): Promise<void> => {
  const data: AnimalPartsMasterData = req.body;
  const { id } = req.params;

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    if (!data.ANIMAL_PARTS_ID && id) {
      data.ANIMAL_PARTS_ID = parseInt(id as string, 10);
    }

    const result = await updateAnimalPartsMasterService(data);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateAnimalPartsMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteAnimalPartsMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "ANIMAL_PARTS_ID is required" });
    return;
  }

  try {
    const result = await deleteAnimalPartsMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteAnimalPartsMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
