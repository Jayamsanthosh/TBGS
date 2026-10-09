import express from "express";
import {
  getAllOpeningStock,
  getOpeningStockHdr,
  getOpeningStockDtls,
  getOpeningStockDtl,
  saveOpeningStock,
  updateOpeningStock,
  deleteOpeningStockDtl,
  deleteOpeningStockHdr
} from "../controllers/openingStockMaster.controller";

const OpeningStockMasterRouter = express.Router();

OpeningStockMasterRouter.get("/", getAllOpeningStock);
OpeningStockMasterRouter.get("/hdr/:refNo", getOpeningStockHdr);
OpeningStockMasterRouter.get("/dtls/:refNo", getOpeningStockDtls);
OpeningStockMasterRouter.get("/dtl/:id", getOpeningStockDtl);
OpeningStockMasterRouter.post("/", saveOpeningStock);
OpeningStockMasterRouter.put("/:refNo", updateOpeningStock);
OpeningStockMasterRouter.delete("/dtl/:id", deleteOpeningStockDtl);
OpeningStockMasterRouter.delete("/:refNo", deleteOpeningStockHdr);

export default OpeningStockMasterRouter;