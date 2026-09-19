import { Request, Response } from "express";
import { getNavigationHierarchyService } from "../services/navigation.services";

export const getNavigationHierarchy = async (req: Request, res: Response): Promise<void> => {
  const roleName = req.query.roleName as string;

  if (!roleName) {
    res.status(400).json({ success: false, message: "Role Name is required" });
    return;
  }

  try {
    const hierarchy = await getNavigationHierarchyService(roleName);
    res.json({ success: true, data: hierarchy });
  } catch (error) {
    console.error("getNavigationHierarchy error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
