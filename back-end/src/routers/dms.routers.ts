import express from "express";
import {
  getAllDocuments,
  getDocumentTypes,
  getDocumentById,
  saveDocument,
  updateDocument,
  deleteDocument
} from "../controllers/dms.controller";

const DMSRouter = express.Router();

DMSRouter.get("/", getAllDocuments);
/* Must stay above "/:id", otherwise "document-types" is parsed as a document id. */
DMSRouter.get("/document-types", getDocumentTypes);
DMSRouter.get("/:id", getDocumentById);
DMSRouter.post("/", saveDocument);
DMSRouter.put("/:id", updateDocument);
DMSRouter.delete("/:id", deleteDocument);

export default DMSRouter;
