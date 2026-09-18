import express from "express";
import {
  getAllArrearsRequest,
  getArrearsRequestById,
  saveArrearsRequest,
  updateArrearsRequest,
  deleteArrearsRequest,
} from "../controllers/arrearsRequest.controller";

const ArrearsRequestRouter = express.Router();

ArrearsRequestRouter.get("/", getAllArrearsRequest);
ArrearsRequestRouter.get("/:id", getArrearsRequestById);
ArrearsRequestRouter.post("/", saveArrearsRequest);
ArrearsRequestRouter.put("/:id", updateArrearsRequest);
ArrearsRequestRouter.delete("/:id", deleteArrearsRequest);

export default ArrearsRequestRouter;
