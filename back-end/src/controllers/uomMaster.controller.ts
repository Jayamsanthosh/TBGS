import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllUomMasterService,
  getUomMasterByIdService,
  saveUomMasterService,
  updateUomMasterService,
  deleteUomMasterService,
  UomMasterData
} from "../services/uomMaster.services";

export const getAllUomMaster = async (_req: Request, res: Response): Promise<void> => {
  try {
    const uoms = await getAllUomMasterService();
    res.json({ success: true, count: uoms.length, data: uoms });
  } catch (error: any) {
    console.error("GetAllUomMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getUomMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "UOM ID is required" });
    return;
  }

  try {
    const uom = await getUomMasterByIdService(parseInt(id as string, 10));

    if (!uom) {
      res.status(404).json({ success: false, message: "UOM not found" });
      return;
    }

    res.json({ success: true, data: uom });
  } catch (error: any) {
    console.error("GetUomMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveUomMaster = async (req: Request, res: Response): Promise<void> => {
  const uomData: UomMasterData = req.body;

  if (!uomData.UOM_NAME) {
    res.status(400).json({ success: false, message: "UOM Name is required" });
    return;
  }

  try {
    const result = await saveUomMasterService(uomData);
    res.json({ success: true, message: result.message || "UOM saved successfully" });
  } catch (error: any) {
    console.error("SaveUomMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateUomMaster = async (req: Request, res: Response): Promise<void> => {
  const uomData: UomMasterData = req.body;
  const { id } = req.params;

  try {
    if (!uomData.UOM_ID && id) {
      uomData.UOM_ID = parseInt(id as string, 10);
    }

    const result = await updateUomMasterService(uomData);
    res.json({ success: true, message: result.message || "UOM updated successfully" });
  } catch (error: any) {
    console.error("UpdateUomMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteUomMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "UOM ID is required" });
    return;
  }

  try {
    const result = await deleteUomMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "UOM deleted successfully" });
  } catch (error: any) {
    console.error("DeleteUomMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
