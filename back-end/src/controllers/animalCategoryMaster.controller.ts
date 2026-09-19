import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  getAllAnimalCategoryMasterService,
  getAnimalCategoryMasterByIdService,
  saveAnimalCategoryMasterService,
  updateAnimalCategoryMasterService,
  deleteAnimalCategoryMasterService,
  type AnimalCategoryMasterData,
} from "../services/animalCategoryMaster.services";

export const getAllAnimalCategoryMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const items = await getAllAnimalCategoryMasterService(status || undefined);
    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error("GetAllAnimalCategoryMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getAnimalCategoryMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "ANIMAL_CATEGORY_ID is required" });
    return;
  }

  try {
    const item = await getAnimalCategoryMasterByIdService(parseInt(id as string, 10));

    if (!item) {
      res.status(404).json({ success: false, message: "Animal category not found" });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GetAnimalCategoryMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

const VALID_STATUSES = ["AC", "IA"];

export const saveAnimalCategoryMaster = async (req: Request, res: Response): Promise<void> => {
  const data: AnimalCategoryMasterData = req.body;

  if (!data.ANIMAL_CATEGORY_NAME?.trim()) {
    res.status(400).json({ success: false, message: "Animal category name is required" });
    return;
  }

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    const result = await saveAnimalCategoryMasterService(data);
    res.json({ success: true, message: result.message || "Data saved successfully", ANIMAL_CATEGORY_ID: result.ANIMAL_CATEGORY_ID });
  } catch (error: any) {
    console.error("SaveAnimalCategoryMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateAnimalCategoryMaster = async (req: Request, res: Response): Promise<void> => {
  const data: AnimalCategoryMasterData = req.body;
  const { id } = req.params;

  if (!data.ANIMAL_CATEGORY_NAME?.trim()) {
    res.status(400).json({ success: false, message: "Animal category name is required" });
    return;
  }

  if (data.STATUS_MASTER && !VALID_STATUSES.includes(data.STATUS_MASTER)) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  try {
    if (!data.ANIMAL_CATEGORY_ID && id) {
      data.ANIMAL_CATEGORY_ID = parseInt(id as string, 10);
    }

    const result = await updateAnimalCategoryMasterService(data);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateAnimalCategoryMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteAnimalCategoryMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "ANIMAL_CATEGORY_ID is required" });
    return;
  }

  try {
    const result = await deleteAnimalCategoryMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteAnimalCategoryMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};