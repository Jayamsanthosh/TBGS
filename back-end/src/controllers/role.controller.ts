import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllRolesService,
  getRoleByIdService,
  saveRoleService,
  updateRoleService,
  deleteRoleService,
  RoleData
} from "../services/role.services";

export const getAllRoles = async (req: Request, res: Response): Promise<void> => {
  try {
    const roles = await getAllRolesService();
    res.json({ success: true, count: roles.length, data: roles });
  } catch (error) {
    console.error("GetAllRoles error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getRole = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "Role ID is required" });
    return;
  }

  try {
    const role = await getRoleByIdService(parseInt(id as string));

    if (!role) {
      res.status(404).json({ success: false, message: "Role not found" });
      return;
    }

    res.json({ success: true, data: role });
  } catch (error) {
    console.error("GetRole error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const saveRole = async (req: Request, res: Response): Promise<void> => {
  const roleData: RoleData = req.body;

  try {
    const result = await saveRoleService(roleData);

    res.json({ success: true, message: result?.message || "Role saved successfully" });
  } catch (error: any) {
    console.error("SaveRole error:", error?.message || error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateRole = async (req: Request, res: Response): Promise<void> => {
  const roleData: RoleData = req.body;
  const { id } = req.params;

  if (id) {
    roleData.ROLE_ID = parseInt(id as string);
  }

  try {
    const result = await updateRoleService(roleData);

    res.json({ success: true, message: result?.message || "Role updated successfully" });
  } catch (error: any) {
    console.error("UpdateRole error:", error?.message || error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteRole = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "Role ID is required" });
    return;
  }

  try {
    const result = await deleteRoleService(parseInt(id as string), USER, ROLE, MAC_ADDRESS);

    res.json({ success: true, message: result?.message || "Role deleted successfully" });
  } catch (error: any) {
    console.error("DeleteRole error:", error?.message || error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
