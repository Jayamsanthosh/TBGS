import express from "express";
import { getAllLinksAndPages, getLinkAndPageById, saveLinkAndPage, updateLinkAndPage, deleteLinkAndPage } from "../controllers/linksAndPages.controller";

const LinksAndPagesRouter = express.Router();

LinksAndPagesRouter.get("/", getAllLinksAndPages);
LinksAndPagesRouter.get("/:id", getLinkAndPageById);
LinksAndPagesRouter.post("/", saveLinkAndPage);
LinksAndPagesRouter.put("/:id", updateLinkAndPage);
LinksAndPagesRouter.delete("/:id", deleteLinkAndPage);

export default LinksAndPagesRouter;
