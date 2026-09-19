import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllClientAdditionalServicesMasterService,
  getClientAdditionalServicesMasterByIdService,
  saveClientAdditionalServicesMasterService,
  updateClientAdditionalServicesMasterService,
  deleteClientAdditionalServicesMasterService,
  ClientAdditionalServicesMasterData
} from "../services/clientAdditionalServicesMaster.services";

export const getAllClientAdditionalServicesMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || "ALL";
    const services = await getAllClientAdditionalServicesMasterService(status);
    res.json({ success: true, count: services.length, data: services });
  } catch (error: any) {
    console.error("GetAllClientAdditionalServicesMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const getClientAdditionalServicesMasterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Services ID is required" });
    return;
  }

  try {
    const service = await getClientAdditionalServicesMasterByIdService(parseInt(id as string, 10));

    if (!service) {
      res.status(404).json({ success: false, message: "Client additional service not found" });
      return;
    }

    res.json({ success: true, data: service });
  } catch (error: any) {
    console.error("GetClientAdditionalServicesMasterById error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const saveClientAdditionalServicesMaster = async (req: Request, res: Response): Promise<void> => {
  const serviceData: ClientAdditionalServicesMasterData = req.body;

  if (!serviceData.SERVICES_NAME) {
    res.status(400).json({ success: false, message: "Service Name is required" });
    return;
  }

  try {
    const result = await saveClientAdditionalServicesMasterService(serviceData);
    res.json({ success: true, message: result.message || "Data saved successfully", SERVICES_ID: result.SERVICES_ID });
  } catch (error: any) {
    console.error("SaveClientAdditionalServicesMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateClientAdditionalServicesMaster = async (req: Request, res: Response): Promise<void> => {
  const serviceData: ClientAdditionalServicesMasterData = req.body;
  const { id } = req.params;

  try {
    if (!serviceData.SERVICES_ID && id) {
      serviceData.SERVICES_ID = parseInt(id as string, 10);
    }

    const result = await updateClientAdditionalServicesMasterService(serviceData);
    res.json({ success: true, message: result.message || "Record updated successfully" });
  } catch (error: any) {
    console.error("UpdateClientAdditionalServicesMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteClientAdditionalServicesMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Services ID is required" });
    return;
  }

  try {
    const result = await deleteClientAdditionalServicesMasterService(
      parseInt(id as string, 10),
      USER as string,
      ROLE as string,
      MAC_ADDRESS as string
    );
    res.json({ success: true, message: result.message || "Record deleted successfully" });
  } catch (error: any) {
    console.error("DeleteClientAdditionalServicesMaster error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
