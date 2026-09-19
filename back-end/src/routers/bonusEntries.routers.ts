import express from "express";
import {
  getAllBonusEntries,
  getBonusEntriesById,
  saveBonusEntries,
  updateBonusEntries,
  deleteBonusEntries,
  submitBonusEntries,
} from "../controllers/bonusEntries.controller";

const BonusEntriesRouter = express.Router();

BonusEntriesRouter.get("/", getAllBonusEntries);
BonusEntriesRouter.get("/:id", getBonusEntriesById);
BonusEntriesRouter.post("/", saveBonusEntries);
BonusEntriesRouter.post("/:id/submit", submitBonusEntries);
BonusEntriesRouter.put("/:id", updateBonusEntries);
BonusEntriesRouter.delete("/:id", deleteBonusEntries);

export default BonusEntriesRouter;