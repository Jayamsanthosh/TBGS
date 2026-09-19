import { Request, Response } from "express";
import { identityFrom } from "../utils/identity";
import {
  getAllUsersService,
  showUserByIdService,
  saveUserInfoService,
  updateUserInfoService,
  deleteUserService,
  UserData
} from "../services/user.services";

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await getAllUsersService();
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error("GetAllUsers error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const showUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: "User ID is required" });
    return;
  }

  try {
    const user = await showUserByIdService(parseInt(id as string));

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error("ShowUser error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const saveUser = async (req: Request, res: Response): Promise<void> => {
  const userData: UserData = req.body;

  try {
    const result = await saveUserInfoService(userData);
    res.json({ success: true, message: result?.message || "User saved successfully" });
  } catch (error: any) {
    console.error("SaveUser error:", error?.message || error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  const userData: UserData = req.body;
  const { id } = req.params;

  if (id) {
    userData.LOGIN_ID = parseInt(id as string);
  }

  try {
    const result = await updateUserInfoService(userData);
    res.json({ success: true, message: result?.message || "User updated successfully" });
  } catch (error: any) {
    console.error("UpdateUser error:", error?.message || error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { USER, ROLE, MAC_ADDRESS } = identityFrom(req);

  if (!id) {
    res.status(400).json({ success: false, message: "User ID is required" });
    return;
  }

  try {
    const result = await deleteUserService(parseInt(id as string), USER, ROLE, MAC_ADDRESS);
    res.json({ success: true, message: result?.message || "User deleted successfully" });
  } catch (error: any) {
    console.error("DeleteUser error:", error?.message || error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
