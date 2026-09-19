import { Request, Response } from "express";

import { identityFrom } from "../utils/identity";
import {
  getAllParticipantTypeMasterService,
  getParticipantTypeMasterByIdService,
  saveParticipantTypeMasterService,
  updateParticipantTypeMasterService,
  deleteParticipantTypeMasterService,
  ParticipantTypeMasterData
} from "../services/participantTypeMaster.services";

export const getAllParticipantTypeMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
    const participantTypes = await getAllParticipantTypeMasterService(status);
    res.json({ success: true, count: participantTypes.length, data: participantTypes });
  } catch (error: any) {
    console.error("GetAllParticipantTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getParticipantTypeMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Participant Type ID is required" });
    return;
  }

  try {
    const participantType = await getParticipantTypeMasterByIdService(parseInt(id as string, 10));

    if (!participantType) {
      res.status(404).json({ success: false, message: "Participant Type not found" });
      return;
    }

    res.json({ success: true, data: participantType });
  } catch (error: any) {
    console.error("GetParticipantTypeMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveParticipantTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const participantTypeData: ParticipantTypeMasterData = req.body;

  if (!participantTypeData.PARTICIPANT_TYPE_NAME) {
    res.status(400).json({ success: false, message: "Participant Type Name is required" });
    return;
  }

  try {
    const result = await saveParticipantTypeMasterService(participantTypeData);
    res.json({ success: true, message: result.message || "Data saved successfully", PARTICIPANT_TYPE_ID: result.PARTICIPANT_TYPE_ID });
  } catch (error: any) {
    console.error("SaveParticipantTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateParticipantTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const participantTypeData: ParticipantTypeMasterData = req.body;
  const { id } = req.params;

  try {
    if (!participantTypeData.PARTICIPANT_TYPE_ID && id) {
      participantTypeData.PARTICIPANT_TYPE_ID = parseInt(id as string, 10);
    }

    const result = await updateParticipantTypeMasterService(participantTypeData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateParticipantTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteParticipantTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Participant Type ID is required" });
    return;
  }

  try {
    const result = await deleteParticipantTypeMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteParticipantTypeMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};