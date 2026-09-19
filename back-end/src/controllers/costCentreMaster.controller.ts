import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllCostCentreMasterService,
  getCostCentreMasterByIdService,
  saveCostCentreMasterService,
  updateCostCentreMasterService,
  deleteCostCentreMasterService,
  CostCentreData
} from "../services/costCentreMaster.services";

export const getAllCostCentreMaster = async (_req: Request, res: Response): Promise<void> => {
  try {
    const centres = await getAllCostCentreMasterService();
    res.json({ success: true, count: centres.length, data: centres });
  } catch (error: any) {
    console.error("GetAllCostCentreMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getCostCentreMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Cost Centre ID is required" });
    return;
  }

  try {
    const centre = await getCostCentreMasterByIdService(parseInt(id as string, 10));

    if (!centre) {
      res.status(404).json({ success: false, message: "Cost centre not found" });
      return;
    }

    res.json({ success: true, data: centre });
  } catch (error: any) {
    console.error("GetCostCentreMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveCostCentreMaster = async (req: Request, res: Response): Promise<void> => {
  const centreData: CostCentreData = req.body;

  if (!centreData.COST_CENTRE_NAME) {
    res.status(400).json({ success: false, message: "Cost Centre Name is required" });
    return;
  }

  try {
    const result = await saveCostCentreMasterService(centreData);
    res.json({ success: true, message: result.message || "Cost centre saved successfully" });
  } catch (error: any) {
    console.error("SaveCostCentreMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateCostCentreMaster = async (req: Request, res: Response): Promise<void> => {
  const centreData: CostCentreData = req.body;
  const { id } = req.params;

  try {
    if (!centreData.COST_CENTRE_ID && id) {
      centreData.COST_CENTRE_ID = parseInt(id as string, 10);
    }

    const result = await updateCostCentreMasterService(centreData);
    res.json({ success: true, message: result.message || "Cost centre updated successfully" });
  } catch (error: any) {
    console.error("UpdateCostCentreMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteCostCentreMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Cost Centre ID is required" });
    return;
  }

  try {
    const result = await deleteCostCentreMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Cost centre deleted successfully" });
  } catch (error: any) {
    console.error("DeleteCostCentreMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
