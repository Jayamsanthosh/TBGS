import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllUserStoreMappingService,
  getUserStoreMappingByIdService,
  saveUserStoreMappingService,
  updateUserStoreMappingService,
  deleteUserStoreMappingService,
  UserStoreMappingData
} from "../services/userStoreMapping.services";

export const getAllUserStoreMapping = async (_req: Request, res: Response): Promise<void> => {
  try {
    const mappings = await getAllUserStoreMappingService();
    res.json({ success: true, count: mappings.length, data: mappings });
  } catch (error: any) {
    console.error("GetAllUserStoreMapping error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getUserStoreMappingById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Mapping ID is required" });
    return;
  }

  try {
    const mapping = await getUserStoreMappingByIdService(parseInt(id as string, 10));

    if (!mapping) {
      res.status(404).json({ success: false, message: "Mapping not found" });
      return;
    }

    res.json({ success: true, data: mapping });
  } catch (error: any) {
    console.error("GetUserStoreMappingById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveUserStoreMapping = async (req: Request, res: Response): Promise<void> => {
  const mappingData: UserStoreMappingData = req.body;

  try {
    const result = await saveUserStoreMappingService(mappingData);
    res.json({ success: true, message: result.message || "Mapping saved successfully" });
  } catch (error: any) {
    console.error("SaveUserStoreMapping error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateUserStoreMapping = async (req: Request, res: Response): Promise<void> => {
  const mappingData: UserStoreMappingData = req.body;
  const { id } = req.params;

  try {
    if (!mappingData.USER_TO_STORE_ID && id) {
      mappingData.USER_TO_STORE_ID = parseInt(id as string, 10);
    }

    const result = await updateUserStoreMappingService(mappingData);
    res.json({ success: true, message: result.message || "Mapping updated successfully" });
  } catch (error: any) {
    console.error("UpdateUserStoreMapping error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteUserStoreMapping = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Mapping ID is required" });
    return;
  }

  try {
    const result = await deleteUserStoreMappingService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Mapping deleted successfully" });
  } catch (error: any) {
    console.error("DeleteUserStoreMapping error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
