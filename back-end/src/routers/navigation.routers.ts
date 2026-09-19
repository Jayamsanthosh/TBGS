import { Router } from "express";
import { getNavigationHierarchy } from "../controllers/navigation.controller";

const router = Router();

router.get("/", getNavigationHierarchy);

export default router;
