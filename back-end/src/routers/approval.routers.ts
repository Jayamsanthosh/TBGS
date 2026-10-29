import express from "express";
import {
  getRequestList,
  getRequestDetail,
  getConversation,
  getApprovalFile,
  updateStatusByType,
  updateStatusByBody,
} from "../controllers/approval.controller";

const ApprovalRouter = express.Router();

// Static routes must be declared BEFORE the /:type wildcard.
ApprovalRouter.get("/conversation", getConversation);
ApprovalRouter.get("/files/:id", getApprovalFile);
ApprovalRouter.post("/status", updateStatusByBody);

ApprovalRouter.get("/:type", getRequestList);
ApprovalRouter.get("/:type/:id", getRequestDetail);
ApprovalRouter.patch("/:type", updateStatusByType);

export default ApprovalRouter;