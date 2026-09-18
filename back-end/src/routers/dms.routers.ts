import express from "express";
import {
  getAllDocuments,
  getDocumentById,
  saveDocument,
  updateDocument,
  deleteDocument
} from "../controllers/dms.controller";

const DMSRouter = express.Router();

DMSRouter.get("/", getAllDocuments);
DMSRouter.get("/:id", getDocumentById);
DMSRouter.post("/", saveDocument);
DMSRouter.put("/:id", updateDocument);
DMSRouter.delete("/:id", deleteDocument);

export default DMSRouter;
