// src/app.ts
// Express app definition — shared by local server.ts and Vercel api/index.ts
// No app.listen() here; the caller decides how to start.
import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import Router from "./routers";

dotenv.config();

const app = express();

const allowedOrigins = (process.env.CORS_URLS || "http://localhost:3000,http://192.168.2.221:94")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use("/api/v1", Router);

app.get("/", (_req: Request, res: Response) => {
  res.send("Welcome to the TBGS Approval Back-end API");
});

export default app;
