// // src/server.ts  – local development entry point
// import { connectDB } from "./config/db";
// import app from "./app";

// const PORT = process.env.PORT || "5000";

// const startServer = async () => {
//   try {
//     await connectDB();
//     app.listen(PORT, () => {
//       console.log(`Back-end server running on http://localhost:${PORT}`);
//     });
//   } catch (error) {
//     console.error("Failed to start server:", error);
//     process.exit(1);
//   }
// };

// void startServer();


// src/server.ts
import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db";
import dotenv from "dotenv";
import Router from "./routers";
dotenv.config();
const app = express();
const PORT = process.env.PORT || "5000";

// app.use(
//   cors({
//     origin: process.env.CORS_URLS || "http://localhost:3000" || "http://192.168.1.15:94",
//     credentials: true, // required so the browser sends/receives the httpOnly auth cookies
//   })
// );
const allowedOrigins = (
  process.env.CORS_URLS ||
  "http://localhost:3000,http://192.168.1.15:94,https://tbgs-demo.visioninfotech.co.tz,http://localhost:4000,http://192.168.2.221:85"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
  app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header
      // (Postman, server-to-server requests, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`CORS blocked origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
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

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Back-end server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

void startServer();
