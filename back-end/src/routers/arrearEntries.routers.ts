import express from "express";
import {
  getAllArrearEntries,
  getArrearEntriesById,
  saveArrearEntries,
  updateArrearEntries,
  deleteArrearEntries,
} from "../controllers/arrearEntries.controller";

const ArrearEntriesRouter = express.Router();

ArrearEntriesRouter.get("/", getAllArrearEntries);
ArrearEntriesRouter.get("/:id", getArrearEntriesById);
ArrearEntriesRouter.post("/", saveArrearEntries);
ArrearEntriesRouter.put("/:id", updateArrearEntries);
ArrearEntriesRouter.delete("/:id", deleteArrearEntries);

export default ArrearEntriesRouter;