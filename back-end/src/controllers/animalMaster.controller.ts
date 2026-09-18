import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllAnimalMasterService,
  getAnimalMasterByIdService,
  saveAnimalMasterService,
  updateAnimalMasterService,
  deleteAnimalMasterService,
  AnimalMasterData
} from "../services/animalMaster.services";

export const getAllAnimalMaster = async (_req: Request, res: Response): Promise<void> => {
  try {
    const animals = await getAllAnimalMasterService();
    res.json({ success: true, count: animals.length, data: animals });
  } catch (error: any) {
    console.error("GetAllAnimalMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getAnimalMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Animal ID is required" });
    return;
  }

  try {
    const animal = await getAnimalMasterByIdService(parseInt(id as string, 10));

    if (!animal) {
      res.status(404).json({ success: false, message: "Animal not found" });
      return;
    }

    res.json({ success: true, data: animal });
  } catch (error: any) {
    console.error("GetAnimalMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveAnimalMaster = async (req: Request, res: Response): Promise<void> => {
  const animalData: AnimalMasterData = req.body;

  if (!animalData.ANIMAL_NAME) {
    res.status(400).json({ success: false, message: "Animal Name is required" });
    return;
  }

  try {
    const result = await saveAnimalMasterService(animalData);
    res.json({ success: true, message: result.message || "Animal saved successfully" });
  } catch (error: any) {
    console.error("SaveAnimalMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateAnimalMaster = async (req: Request, res: Response): Promise<void> => {
  const animalData: AnimalMasterData = req.body;
  const { id } = req.params;

  try {
    if (!animalData.ANIMAL_ID && id) {
      animalData.ANIMAL_ID = parseInt(id as string, 10);
    }

    const result = await updateAnimalMasterService(animalData);
    res.json({ success: true, message: result.message || "Animal updated successfully" });
  } catch (error: any) {
    console.error("UpdateAnimalMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteAnimalMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Animal ID is required" });
    return;
  }

  try {
    const result = await deleteAnimalMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Animal deleted successfully" });
  } catch (error: any) {
    console.error("DeleteAnimalMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
