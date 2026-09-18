import express from "express";
import {
  getAllOvertimeRequest,
  getOvertimeRequestById,
  saveOvertimeRequest,
  updateOvertimeRequest,
  deleteOvertimeRequest,
} from "../controllers/overtimeRequest.controller";

const OvertimeRequestRouter = express.Router();

OvertimeRequestRouter.get("/", getAllOvertimeRequest);
OvertimeRequestRouter.get("/:id", getOvertimeRequestById);
OvertimeRequestRouter.post("/", saveOvertimeRequest);
OvertimeRequestRouter.put("/:id", updateOvertimeRequest);
OvertimeRequestRouter.delete("/:id", deleteOvertimeRequest);

export default OvertimeRequestRouter;
