import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllParticipantTypeMasterService,
  getParticipantTypeMasterByIdService,
  saveParticipantTypeMasterService,
  updateParticipantTypeMasterService,
  deleteParticipantTypeMasterService,
  ParticipantTypeMasterData,
} from "../services/participantTypeMaster.services";

const parseId = (raw: unknown): number | null => {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const VALID_STATUSES = ["AC", "IA", "ACTIVE", "INACTIVE"];

export const getAllParticipantTypeMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
    const participantTypes = await getAllParticipantTypeMasterService(status);
    res.json({ success: true, count: participantTypes.length, data: participantTypes });
  } catch (error: any) {
    console.error("GetAllParticipantTypeMaster error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getParticipantTypeMasterById = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);

  if (!id) {
    res.status(400).json({ success: false, message: "A valid Participant Type ID is required" });
    return;
  }

  try {
    const rawLinkId = req.query.LINK_ID ?? req.query.link_id;
    const linkId = rawLinkId != null && rawLinkId !== "" ? Number(rawLinkId) : null;
    const participantType = await getParticipantTypeMasterByIdService(id, Number.isFinite(linkId) ? linkId : null);

    if (!participantType) {
      res.status(404).json({ success: false, message: "Participant type not found" });
      return;
    }

    res.json({ success: true, data: participantType });
  } catch (error: any) {
    console.error("GetParticipantTypeMasterById error:", error);
    res.status(error?.httpStatus || 500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveParticipantTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const participantTypeData: ParticipantTypeMasterData = req.body;

  if (!participantTypeData.PARTICIPANT_TYPE_NAME?.trim()) {
    res.status(400).json({ success: false, message: "Participant Type Name is required" });
    return;
  }

  if (participantTypeData.STATUS_MASTER && !VALID_STATUSES.includes(participantTypeData.STATUS_MASTER.toUpperCase())) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  const { USER, MAC_ADDRESS } = identityFrom(req);
  participantTypeData.USER = USER || participantTypeData.USER || "Admin";
  participantTypeData.MAC_ADDRESS = MAC_ADDRESS || participantTypeData.MAC_ADDRESS || "WEB";
  if (participantTypeData.LINK_ID === undefined || participantTypeData.LINK_ID === null) {
    participantTypeData.LINK_ID = 243;
  }

  try {
    const result = await saveParticipantTypeMasterService(participantTypeData);
    res.json({
      success: true,
      message: result.message || "Data Saved Successfully",
      data: result.PARTICIPANT_TYPE_ID,
      PARTICIPANT_TYPE_ID: result.PARTICIPANT_TYPE_ID,
    });
  } catch (error: any) {
    console.error("SaveParticipantTypeMaster error:", error);
    res.status(error?.httpStatus || 400).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateParticipantTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const participantTypeData: ParticipantTypeMasterData = req.body;
  const id = parseId(req.params.id) ?? parseId(participantTypeData.PARTICIPANT_TYPE_ID);

  if (!id) {
    res.status(400).json({ success: false, message: "A valid Participant Type ID is required" });
    return;
  }

  if (!participantTypeData.PARTICIPANT_TYPE_NAME?.trim()) {
    res.status(400).json({ success: false, message: "Participant Type Name is required" });
    return;
  }

  if (participantTypeData.STATUS_MASTER && !VALID_STATUSES.includes(participantTypeData.STATUS_MASTER.toUpperCase())) {
    res.status(400).json({ success: false, message: "Status must be AC or IA" });
    return;
  }

  participantTypeData.PARTICIPANT_TYPE_ID = id;
  const { USER, MAC_ADDRESS } = identityFrom(req);
  participantTypeData.USER = USER || participantTypeData.USER || "Admin";
  participantTypeData.MAC_ADDRESS = MAC_ADDRESS || participantTypeData.MAC_ADDRESS || "WEB";
  if (participantTypeData.LINK_ID === undefined || participantTypeData.LINK_ID === null) {
    participantTypeData.LINK_ID = 243;
  }

  try {
    const result = await updateParticipantTypeMasterService(participantTypeData);
    res.json({
      success: true,
      message: result.message || "Data Updated Successfully",
      data: result.PARTICIPANT_TYPE_ID,
      PARTICIPANT_TYPE_ID: result.PARTICIPANT_TYPE_ID,
    });
  } catch (error: any) {
    console.error("UpdateParticipantTypeMaster error:", error);
    res.status(error?.httpStatus || 400).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteParticipantTypeMaster = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "A valid Participant Type ID is required" });
    return;
  }

  try {
    const result = await deleteParticipantTypeMasterService(
      id,
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Data Deleted Successfully" });
  } catch (error: any) {
    console.error("DeleteParticipantTypeMaster error:", error);
    res.status(error?.httpStatus || 400).json({ success: false, message: error?.message || "Internal server error" });
  }
};