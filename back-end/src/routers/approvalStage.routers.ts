import express from "express";
import {
  getAllApprovalStageHdr,
  getApprovalStageHdr,
  getApprovalStageDtlByStage,
  getApprovalStageDtl,
  saveApprovalStageHdr,
  updateApprovalStageHdr,
  saveApprovalStageDtl,
  updateApprovalStageDtl,
  deleteApprovalStageDtl,
  deleteApprovalStageHdr,
} from "../controllers/approvalStage.controller";

const ApprovalStageRouter = express.Router();

ApprovalStageRouter.get("/", getAllApprovalStageHdr);
ApprovalStageRouter.get("/hdr/:id", getApprovalStageHdr);
ApprovalStageRouter.get("/hdr/:id/dtls", getApprovalStageDtlByStage);
ApprovalStageRouter.get("/dtl/:id", getApprovalStageDtl);
ApprovalStageRouter.post("/", saveApprovalStageHdr);
ApprovalStageRouter.put("/hdr/:id", updateApprovalStageHdr);
ApprovalStageRouter.delete("/hdr/:id", deleteApprovalStageHdr);
ApprovalStageRouter.post("/dtl", saveApprovalStageDtl);
ApprovalStageRouter.put("/dtl/:id", updateApprovalStageDtl);
ApprovalStageRouter.delete("/dtl/:id", deleteApprovalStageDtl);

export default ApprovalStageRouter;
