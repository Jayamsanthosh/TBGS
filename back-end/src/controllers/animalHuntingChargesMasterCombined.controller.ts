import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllAnimalHuntingChargesMasterCombinedService,
  getAnimalHuntingChargesMasterHdrService,
  getAnimalHuntingChargesMasterDtlService,
  saveAnimalHuntingChargesMasterCombinedService,
  updateAnimalHuntingChargesMasterCombinedService,
  deleteAnimalHuntingChargesMasterDtlService,
  deleteAnimalHuntingChargesMasterHdrService,
  AnimalHuntingChargesMasterData
} from "../services/animalHuntingChargesMasterCombined.services";

export const getAllAnimalHuntingChargesMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await getAllAnimalHuntingChargesMasterCombinedService();
    res.json({ success: true, count: data.length, data });
  } catch (error: any) {
    console.error("GetAllAnimalHuntingChargesMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getAnimalHuntingChargesMasterHdr = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Hunting charge ID is required" });
    return;
  }

  try {
    const data = await getAnimalHuntingChargesMasterHdrService(parseInt(id as string, 10));
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("GetAnimalHuntingChargesMasterHdr error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getAnimalHuntingChargesMasterDtl = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Detail SNO is required" });
    return;
  }

  try {
    const data = await getAnimalHuntingChargesMasterDtlService(parseInt(id as string, 10));
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("GetAnimalHuntingChargesMasterDtl error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveAnimalHuntingChargesMaster = async (req: Request, res: Response): Promise<void> => {
  const data: AnimalHuntingChargesMasterData = req.body;

  if (!data.COMPANY_ID || !data.EFFECTIVE_YEAR) {
    res.status(400).json({ success: false, message: "Company and Effective Year are required" });
    return;
  }

  const dtls = Array.isArray(data.dtls) ? data.dtls : [];
  if (!dtls.length || !dtls.some((d) => d.ANIMAL_ID)) {
    res.status(400).json({ success: false, message: "At least one Animal is required" });
    return;
  }

  try {
    const result = await saveAnimalHuntingChargesMasterCombinedService(data);
    res.json({ success: true, message: result.message || "Animal hunting charges saved successfully", ANIMAL_HUNT_CHARGE_ID: result.ANIMAL_HUNT_CHARGE_ID });
  } catch (error: any) {
    console.error("SaveAnimalHuntingChargesMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateAnimalHuntingChargesMaster = async (req: Request, res: Response): Promise<void> => {
  const data: AnimalHuntingChargesMasterData = req.body;
  const { id } = req.params;

  try {
    if (!data.ANIMAL_HUNT_CHARGE_ID && id) {
      data.ANIMAL_HUNT_CHARGE_ID = parseInt(id as string, 10);
    }

    const result = await updateAnimalHuntingChargesMasterCombinedService(data);
    res.json({ success: true, message: result.message || "Animal hunting charges updated successfully" });
  } catch (error: any) {
    console.error("UpdateAnimalHuntingChargesMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteAnimalHuntingChargesMasterDtl = async (req: Request, res: Response): Promise<void> => {
  const { sno } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!sno) {
    res.status(400).json({ success: false, message: "Detail SNO is required" });
    return;
  }

  try {
    const result = await deleteAnimalHuntingChargesMasterDtlService(
      parseInt(sno as string, 10),
      USER || "Admin",
      ROLE || "Admin",
      MAC_ADDRESS || "WEB"
    );
    res.json({ success: true, message: result.message || "Hunting charge detail deleted successfully" });
  } catch (error: any) {
    console.error("DeleteAnimalHuntingChargesMasterDtl error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteAnimalHuntingChargesMasterHdr = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Hunting charge ID is required" });
    return;
  }

  try {
    const result = await deleteAnimalHuntingChargesMasterHdrService(
      parseInt(id as string, 10),
      USER || "Admin",
      ROLE || "Admin",
      MAC_ADDRESS || "WEB"
    );
    res.json({ success: true, message: result.message || "Hunting charge header deleted successfully" });
  } catch (error: any) {
    console.error("DeleteAnimalHuntingChargesMasterHdr error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
