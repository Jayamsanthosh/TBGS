import express from "express";
import {
  getAllBonusRequest,
  getBonusRequestById,
  saveBonusRequest,
  updateBonusRequest,
  deleteBonusRequest,
} from "../controllers/bonusRequest.controller";

const BonusRequestRouter = express.Router();

BonusRequestRouter.get("/", getAllBonusRequest);
BonusRequestRouter.get("/:id", getBonusRequestById);
BonusRequestRouter.post("/", saveBonusRequest);
BonusRequestRouter.put("/:id", updateBonusRequest);
BonusRequestRouter.delete("/:id", deleteBonusRequest);

export default BonusRequestRouter;
