import express from "express";
import {
  getAllApprovalTemplateHdr,
  getApprovalTemplateHdr,
  getRequesterDtlsByTemplate,
  getStageDtlsByTemplate,
  saveApprovalTemplateHdr,
  updateApprovalTemplateHdr,
  saveApprovalTemplateRequesterDtl,
  updateApprovalTemplateRequesterDtl,
  deleteApprovalTemplateRequesterDtl,
  saveApprovalTemplateStageDtl,
  updateApprovalTemplateStageDtl,
  deleteApprovalTemplateStageDtl,
  deleteApprovalTemplateHdr,
} from "../controllers/approvalTemplate.controller";

const ApprovalTemplateRouter = express.Router();

ApprovalTemplateRouter.get("/", getAllApprovalTemplateHdr);
ApprovalTemplateRouter.get("/hdr/:id", getApprovalTemplateHdr);
ApprovalTemplateRouter.get("/hdr/:id/requester-dtls", getRequesterDtlsByTemplate);
ApprovalTemplateRouter.get("/hdr/:id/stage-dtls", getStageDtlsByTemplate);
ApprovalTemplateRouter.post("/", saveApprovalTemplateHdr);
ApprovalTemplateRouter.put("/hdr/:id", updateApprovalTemplateHdr);
ApprovalTemplateRouter.delete("/hdr/:id", deleteApprovalTemplateHdr);

ApprovalTemplateRouter.post("/requester-dtl", saveApprovalTemplateRequesterDtl);
ApprovalTemplateRouter.put("/requester-dtl/:id", updateApprovalTemplateRequesterDtl);
ApprovalTemplateRouter.delete("/requester-dtl/:id", deleteApprovalTemplateRequesterDtl);

ApprovalTemplateRouter.post("/stage-dtl", saveApprovalTemplateStageDtl);
ApprovalTemplateRouter.put("/stage-dtl/:id", updateApprovalTemplateStageDtl);
ApprovalTemplateRouter.delete("/stage-dtl/:id", deleteApprovalTemplateStageDtl);

export default ApprovalTemplateRouter;
